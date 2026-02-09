"""
Vector Store - Simple In-Memory Implementation

For demo purposes without heavy dependencies.
In production, use LanceDB with sentence-transformers.
"""

import os
import uuid
import hashlib
from datetime import datetime
from typing import Dict, Any, List, Optional
import json
from pathlib import Path


class VectorStore:
    """Simple in-memory vector store for demo purposes."""
    
    def __init__(self, db_path: str = "./data/vectordb"):
        """Initialize the vector store."""
        self.db_path = Path(db_path)
        self.db_path.mkdir(parents=True, exist_ok=True)
        self.documents: Dict[str, Dict[str, Any]] = {}
        self._load_documents()
    
    def _load_documents(self):
        """Load documents from disk."""
        db_file = self.db_path / "documents.json"
        if db_file.exists():
            try:
                with open(db_file, 'r') as f:
                    self.documents = json.load(f)
            except json.JSONDecodeError:
                self.documents = {}
    
    def _save_documents(self):
        """Save documents to disk."""
        db_file = self.db_path / "documents.json"
        with open(db_file, 'w') as f:
            json.dump(self.documents, f, indent=2)
    
    def _simple_hash(self, text: str) -> List[float]:
        """Create a simple hash-based 'embedding' for demo."""
        # This is NOT a real embedding - just for demo purposes
        hash_bytes = hashlib.sha256(text.encode()).digest()
        return [b / 255.0 for b in hash_bytes[:32]]
    
    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        """Calculate cosine similarity between two vectors."""
        dot_product = sum(x * y for x, y in zip(a, b))
        norm_a = sum(x * x for x in a) ** 0.5
        norm_b = sum(x * x for x in b) ** 0.5
        if norm_a == 0 or norm_b == 0:
            return 0
        return dot_product / (norm_a * norm_b)
    
    async def add(self, document: Dict[str, Any]) -> str:
        """Add a document to the vector store."""
        doc_id = str(uuid.uuid4())
        content = document.get("content", "")
        
        # Generate simple embedding
        embedding = self._simple_hash(content)
        
        # Store document
        self.documents[doc_id] = {
            "id": doc_id,
            "content": content[:10000],
            "session_id": document.get("session_id", ""),
            "timestamp": document.get("timestamp", datetime.utcnow().isoformat()),
            "metadata": document.get("metadata", {}),
            "embedding": embedding
        }
        
        self._save_documents()
        return doc_id
    
    async def search(
        self, 
        query: str, 
        limit: int = 5,
        session_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents."""
        if not self.documents:
            return []
        
        query_embedding = self._simple_hash(query)
        
        # Calculate similarities
        results = []
        for doc_id, doc in self.documents.items():
            if session_id and doc.get("session_id") != session_id:
                continue
            
            similarity = self._cosine_similarity(query_embedding, doc.get("embedding", []))
            results.append({
                "id": doc_id,
                "content": doc.get("content", ""),
                "session_id": doc.get("session_id", ""),
                "timestamp": doc.get("timestamp", ""),
                "score": similarity
            })
        
        # Sort by similarity and return top results
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]
    
    async def get(self, doc_id: str) -> Optional[Dict[str, Any]]:
        """Get a document by ID."""
        return self.documents.get(doc_id)
    
    async def delete(self, doc_id: str) -> bool:
        """Delete a document by ID."""
        if doc_id in self.documents:
            del self.documents[doc_id]
            self._save_documents()
            return True
        return False
    
    async def clear_session(self, session_id: str) -> int:
        """Clear all documents for a session."""
        to_delete = [
            doc_id for doc_id, doc in self.documents.items()
            if doc.get("session_id") == session_id
        ]
        for doc_id in to_delete:
            del self.documents[doc_id]
        self._save_documents()
        return len(to_delete)
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get vector store statistics."""
        return {
            "total_documents": len(self.documents),
            "embedding_model": "simple-hash-256",
            "embedding_dim": 32
        }
