"""
Helix Mind - Autonomous Bio-Research Agent
FastAPI Backend Server

Features:
- Multimodal analysis (PDF, Image, Video, Text)
- Gemini 3 Pro with thinking_level: high
- LanceDB vector store for RAG
- Session memory persistence
- Dynamic chart generation
"""

import os
import uuid
import json
import base64
from datetime import datetime
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pydantic import BaseModel
import aiofiles

from dotenv import load_dotenv

load_dotenv()

# Import custom modules
from gemini_client import GeminiClient
from vector_store import VectorStore
from memory_engine import MemoryEngine
from chart_generator import ChartGenerator

# Global instances
gemini_client: Optional[GeminiClient] = None
vector_store: Optional[VectorStore] = None
memory_engine: Optional[MemoryEngine] = None
chart_generator: Optional[ChartGenerator] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize and cleanup resources."""
    global gemini_client, vector_store, memory_engine, chart_generator
    
    # Initialize components
    gemini_client = GeminiClient()
    vector_store = VectorStore()
    memory_engine = MemoryEngine()
    chart_generator = ChartGenerator(gemini_client)
    
    print("🧬 Helix Mind initialized!")
    yield
    
    # Cleanup
    print("🧬 Helix Mind shutting down...")


app = FastAPI(
    title="Helix Mind API",
    description="Autonomous Bio-Research Agent powered by Gemini 3",
    version="1.0.0",
    lifespan=lifespan,
    root_path=os.getenv("FASTAPI_ROOT_PATH", "")
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============== Request/Response Models ==============

class AnalysisRequest(BaseModel):
    text: str
    session_id: Optional[str] = None
    include_memory: bool = True
    thinking_level: str = "high"


class AnalysisResponse(BaseModel):
    session_id: str
    result: str
    thinking_trace: List[str]
    charts: List[Dict[str, Any]]
    memory_context: List[Dict[str, Any]]
    timestamp: str


class ChartRequest(BaseModel):
    data: Dict[str, Any]
    chart_type: str
    title: str
    session_id: Optional[str] = None


class MemoryItem(BaseModel):
    id: str
    content: str
    type: str
    timestamp: str
    relevance_score: float


# ============== API Endpoints ==============

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "online",
        "service": "Helix Mind",
        "version": "1.0.0",
        "gemini_model": "gemini-3-pro",
        "features": [
            "multimodal_analysis",
            "vectorized_memory",
            "dynamic_charts",
            "thinking_traces"
        ]
    }


from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    print(f"❌ Validation Error: {exc}")
    # Return detailed error
    return JSONResponse(
        status_code=422,
        content={"detail": str(exc), "body": str(exc.body) if hasattr(exc, "body") else "No body"},
    )

@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(
    text: Optional[str] = Form(None),
    session_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[])
):
    """
    Perform multimodal analysis using Gemini 3 Pro.
    
    Accepts:
    - Text queries
    - PDF documents
    - Images (microscopy, cell cultures, etc.)
    - Protein sequences
    """
    # Handle missing text
    if not text:
        text = "Analyze the uploaded files."
    # Generate or use existing session
    session_id = session_id or str(uuid.uuid4())
    
    # Process uploaded files
    file_contents = []
    for file in files:
        content = await file.read()
        file_type = file.content_type or "application/octet-stream"
        
        if file_type.startswith("image/"):
            # Encode image as base64
            file_contents.append({
                "type": "image",
                "data": base64.b64encode(content).decode(),
                "mime_type": file_type,
                "filename": file.filename
            })
        elif file_type == "application/pdf":
            # Extract text from PDF
            from PyPDF2 import PdfReader
            import io
            reader = PdfReader(io.BytesIO(content))
            pdf_text = "\n".join(page.extract_text() for page in reader.pages)
            file_contents.append({
                "type": "pdf",
                "data": pdf_text,
                "filename": file.filename
            })
        else:
            # Raw text/data
            file_contents.append({
                "type": "text",
                "data": content.decode("utf-8", errors="ignore"),
                "filename": file.filename
            })
    
    # Retrieve relevant memory context
    memory_context = await memory_engine.retrieve(session_id, text, limit=5)
    
    # Retrieve relevant documents from vector store
    vector_context = await vector_store.search(text, limit=3)
    
    # Build context for Gemini
    context = {
        "query": text,
        "files": file_contents,
        "memory": memory_context,
        "vector_context": vector_context
    }
    
    # **INDEX UPLOADED FILES FOR RAG** - Critical for file-based queries!
    for file_content in file_contents:
        if file_content["type"] in ["pdf", "text"]:
            # Chunk and index the document content for RAG retrieval
            content = file_content.get("data", "")
            filename = file_content.get("filename", "uploaded_file")
            
            # Split into chunks for better retrieval
            chunk_size = 2000
            chunks = [content[i:i+chunk_size] for i in range(0, len(content), chunk_size)]
            
            for i, chunk in enumerate(chunks):
                await vector_store.add({
                    "content": f"[Document: {filename}] (Part {i+1}/{len(chunks)})\n{chunk}",
                    "session_id": session_id,
                    "metadata": {
                        "type": "uploaded_document",
                        "filename": filename,
                        "chunk_index": i,
                        "total_chunks": len(chunks)
                    },
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            print(f"📄 Indexed {filename} ({len(chunks)} chunks) for RAG")
    
    # Analyze with Gemini 3 Pro
    result = await gemini_client.analyze(context, thinking_level="high")
    
    # Store in memory for future sessions
    await memory_engine.store(session_id, {
        "query": text,
        "result": result["response"],
        "files": [f["filename"] for f in file_contents],
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Index result in vector store
    await vector_store.add({
        "content": f"Query: {text}\nResult: {result['response']}",
        "session_id": session_id,
        "timestamp": datetime.utcnow().isoformat()
    })
    
    # Generate any charts if the analysis suggests them
    charts = []
    if result.get("chart_data"):
        for chart_data in result["chart_data"]:
            chart = await chart_generator.generate(chart_data)
            charts.append(chart)
    
    return AnalysisResponse(
        session_id=session_id,
        result=result["response"],
        thinking_trace=result.get("thinking_trace", []),
        charts=charts,
        memory_context=memory_context,
        timestamp=datetime.utcnow().isoformat()
    )


@app.post("/analyze/stream")
async def analyze_stream(
    text: str = Form(...),
    session_id: Optional[str] = Form(None),
    files: List[UploadFile] = File(default=[])
):
    """
    Stream analysis results with real-time thinking traces.
    Perfect for the Thinking Console UI component.
    """
    session_id = session_id or str(uuid.uuid4())
    
    # Process files
    file_contents = []
    for file in files:
        content = await file.read()
        file_type = file.content_type or "application/octet-stream"
        
        if file_type.startswith("image/"):
            file_contents.append({
                "type": "image",
                "data": base64.b64encode(content).decode(),
                "mime_type": file_type,
                "filename": file.filename
            })
        elif file_type == "application/pdf":
            from PyPDF2 import PdfReader
            import io
            reader = PdfReader(io.BytesIO(content))
            pdf_text = "\n".join(page.extract_text() for page in reader.pages)
            file_contents.append({
                "type": "pdf",
                "data": pdf_text,
                "filename": file.filename
            })
    
    # Get memory context
    memory_context = await memory_engine.retrieve(session_id, text, limit=5)
    
    context = {
        "query": text,
        "files": file_contents,
        "memory": memory_context
    }
    
    async def generate():
        async for chunk in gemini_client.analyze_stream(context, thinking_level="high"):
            yield f"data: {json.dumps(chunk)}\n\n"
        
        # Store in memory after completion
        yield f"data: {json.dumps({'type': 'complete', 'session_id': session_id})}\n\n"
    
    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        }
    )


@app.get("/memory/{session_id}")
async def get_memory(session_id: str, limit: int = 20):
    """Retrieve session memory and past analyses."""
    memories = await memory_engine.get_session_history(session_id, limit=limit)
    return {
        "session_id": session_id,
        "memories": memories,
        "count": len(memories)
    }


@app.delete("/memory/{session_id}")
async def clear_memory(session_id: str):
    """Clear session memory."""
    await memory_engine.clear_session(session_id)
    return {"status": "cleared", "session_id": session_id}


@app.post("/generate-chart")
async def generate_chart(request: ChartRequest):
    """Generate a dynamic chart from data."""
    chart = await chart_generator.generate({
        "data": request.data,
        "type": request.chart_type,
        "title": request.title
    })
    return chart


@app.post("/generate-diagram")
async def generate_diagram(
    description: str = Form(...),
    diagram_type: str = Form("flowchart")
):
    """Generate a Mermaid diagram from natural language description."""
    diagram = await chart_generator.generate_mermaid(description, diagram_type)
    return diagram


@app.post("/vectorize")
async def vectorize_document(
    file: UploadFile = File(...),
    session_id: str = Form(None),
    metadata: str = Form("{}")
):
    """Add a document to the vector store for future RAG retrieval."""
    content = await file.read()
    
    if file.content_type == "application/pdf":
        from PyPDF2 import PdfReader
        import io
        reader = PdfReader(io.BytesIO(content))
        text = "\n".join(page.extract_text() for page in reader.pages)
    else:
        text = content.decode("utf-8", errors="ignore")
    
    meta = json.loads(metadata)
    meta["filename"] = file.filename
    meta["timestamp"] = datetime.utcnow().isoformat()
    
    # Chunk the document for better retrieval
    chunk_size = 2000
    chunks = [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]
    
    doc_ids = []
    for i, chunk in enumerate(chunks):
        doc_id = await vector_store.add({
            "content": f"[Document: {file.filename}] (Part {i+1}/{len(chunks)})\n{chunk}",
            "session_id": session_id or "",
            "metadata": {
                **meta,
                "type": "uploaded_document",
                "chunk_index": i,
                "total_chunks": len(chunks)
            },
            "timestamp": datetime.utcnow().isoformat()
        })
        doc_ids.append(doc_id)
    
    print(f"📄 Vectorized {file.filename}: {len(chunks)} chunks indexed")
    
    return {
        "status": "indexed",
        "document_ids": doc_ids,
        "filename": file.filename,
        "chunks": len(chunks),
        "total_chars": len(text)
    }


@app.get("/vector-search")
async def vector_search(query: str, limit: int = 5):
    """Search the vector store for relevant documents."""
    results = await vector_store.search(query, limit=limit)
    return {
        "query": query,
        "results": results
    }


# Serve Static Frontend
from fastapi.staticfiles import StaticFiles

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Mount static files (HTML=True allows serving index.html on /)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("DEBUG", "true").lower() == "true"
    )
