"""
Memory Engine - Persistent Session Memory

Simple implementation without sentence-transformers.
For demo purposes - uses keyword matching instead of embeddings.
"""

import os
import json
import uuid
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from pathlib import Path


class MemoryEngine:
    """Persistent memory engine for cross-session learning."""
    
    def __init__(self, storage_path: str = "./data/memory"):
        """Initialize the memory engine."""
        self.storage_path = Path(storage_path)
        self.storage_path.mkdir(parents=True, exist_ok=True)
        
        # In-memory cache for active sessions
        self.cache: Dict[str, List[Dict[str, Any]]] = {}
        
        # Configuration
        self.max_memory_items = int(os.getenv("MAX_MEMORY_ITEMS", 100))
        self.session_expiry_hours = int(os.getenv("SESSION_EXPIRY_HOURS", 24))
    
    def _get_session_file(self, session_id: str) -> Path:
        """Get the file path for a session."""
        return self.storage_path / f"{session_id}.json"
    
    def _load_session(self, session_id: str) -> List[Dict[str, Any]]:
        """Load session data from disk."""
        if session_id in self.cache:
            return self.cache[session_id]
        
        session_file = self._get_session_file(session_id)
        if session_file.exists():
            try:
                with open(session_file, 'r') as f:
                    data = json.load(f)
                    self.cache[session_id] = data
                    return data
            except json.JSONDecodeError:
                return []
        return []
    
    def _save_session(self, session_id: str, data: List[Dict[str, Any]]):
        """Save session data to disk."""
        self.cache[session_id] = data
        session_file = self._get_session_file(session_id)
        with open(session_file, 'w') as f:
            json.dump(data, f, indent=2)
    
    def _simple_hash(self, text: str) -> List[float]:
        """Create a simple hash-based 'embedding' for demo."""
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
    
    async def store(self, session_id: str, memory: Dict[str, Any]) -> str:
        """Store a memory item for a session."""
        session_data = self._load_session(session_id)
        
        # Create memory item
        memory_id = str(uuid.uuid4())
        memory_text = str(memory.get("query", "")) + " " + str(memory.get("result", ""))
        
        memory_item = {
            "id": memory_id,
            "content": memory,
            "timestamp": datetime.utcnow().isoformat(),
            "embedding": self._simple_hash(memory_text)
        }
        
        # Add to session
        session_data.append(memory_item)
        
        # Trim if exceeds max items
        if len(session_data) > self.max_memory_items:
            session_data = session_data[-self.max_memory_items:]
        
        # Save
        self._save_session(session_id, session_data)
        
        return memory_id
    
    async def retrieve(
        self, 
        session_id: str, 
        query: str, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant memories for a query."""
        session_data = self._load_session(session_id)
        
        if not session_data:
            return []
        
        # Generate query embedding
        query_embedding = self._simple_hash(query)
        
        # Calculate similarities
        scored_memories = []
        for item in session_data:
            if "embedding" in item:
                similarity = self._cosine_similarity(query_embedding, item["embedding"])
                scored_memories.append({
                    "id": item["id"],
                    "content": item["content"],
                    "timestamp": item["timestamp"],
                    "relevance_score": float(similarity)
                })
        
        # Sort by relevance and return top results
        scored_memories.sort(key=lambda x: x["relevance_score"], reverse=True)
        return scored_memories[:limit]
    
    async def get_session_history(
        self, 
        session_id: str, 
        limit: int = 20
    ) -> List[Dict[str, Any]]:
        """Get chronological session history."""
        session_data = self._load_session(session_id)
        
        # Return most recent items
        history = []
        for item in session_data[-limit:]:
            history.append({
                "id": item["id"],
                "content": item["content"],
                "timestamp": item["timestamp"]
            })
        
        return history
    
    async def clear_session(self, session_id: str):
        """Clear all memories for a session."""
        # Remove from cache
        if session_id in self.cache:
            del self.cache[session_id]
        
        # Remove from disk
        session_file = self._get_session_file(session_id)
        if session_file.exists():
            session_file.unlink()
    
    async def get_all_sessions(self) -> List[Dict[str, Any]]:
        """Get summary of all active sessions."""
        sessions = []
        
        for session_file in self.storage_path.glob("*.json"):
            session_id = session_file.stem
            try:
                with open(session_file, 'r') as f:
                    data = json.load(f)
                    sessions.append({
                        "session_id": session_id,
                        "memory_count": len(data),
                        "last_updated": data[-1]["timestamp"] if data else None
                    })
            except Exception:
                continue
        
        return sessions
    
    async def cleanup_expired(self) -> int:
        """Remove expired sessions."""
        expiry_threshold = datetime.utcnow() - timedelta(hours=self.session_expiry_hours)
        removed = 0
        
        for session_file in self.storage_path.glob("*.json"):
            try:
                with open(session_file, 'r') as f:
                    data = json.load(f)
                    if data:
                        last_timestamp = datetime.fromisoformat(data[-1]["timestamp"])
                        if last_timestamp < expiry_threshold:
                            session_file.unlink()
                            removed += 1
            except Exception:
                continue
        
        return removed
    
    async def get_learning_patterns(self, session_id: str) -> Dict[str, Any]:
        """Analyze learning patterns from session history."""
        session_data = self._load_session(session_id)
        
        if not session_data:
            return {"patterns": [], "insights": "No data available"}
        
        # Simple pattern analysis
        queries = []
        
        for item in session_data:
            content = item.get("content", {})
            if isinstance(content, dict):
                query = content.get("query", "")
                queries.append(query)
        
        return {
            "total_queries": len(queries),
            "session_duration": "N/A",
            "patterns": [],
            "insights": f"Session contains {len(session_data)} memory items."
        }
