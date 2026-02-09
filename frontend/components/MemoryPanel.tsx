'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Clock, Trash2, RefreshCw, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface MemoryPanelProps {
    sessionId: string | null;
}

interface MemoryItem {
    id: string;
    content: any;
    timestamp: string;
}

export default function MemoryPanel({ sessionId }: MemoryPanelProps) {
    const [memories, setMemories] = useState<MemoryItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchMemories = async () => {
        if (!sessionId) return;

        setIsLoading(true);
        setError(null);

        try {
            const response = await axios.get(`/api/memory/${sessionId}`);
            setMemories(response.data.memories || []);
        } catch (err) {
            setError('Failed to load memories');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const clearMemories = async () => {
        if (!sessionId) return;

        try {
            await axios.delete(`/api/memory/${sessionId}`);
            setMemories([]);
        } catch (err) {
            setError('Failed to clear memories');
        }
    };

    useEffect(() => {
        fetchMemories();
    }, [sessionId]);

    const formatTimestamp = (timestamp: string) => {
        try {
            const date = new Date(timestamp);
            return date.toLocaleString();
        } catch {
            return timestamp;
        }
    };

    const getContentPreview = (content: any) => {
        if (typeof content === 'string') return content;
        if (typeof content === 'object') {
            if (content.query) return content.query;
            if (content.result) return content.result.slice(0, 100) + '...';
            return JSON.stringify(content).slice(0, 100) + '...';
        }
        return String(content);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="card">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-neon-magenta/10 border border-neon-magenta/30">
                            <History className="w-8 h-8 text-neon-magenta" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Session Memory</h2>
                            <p className="text-sm text-gray-400">
                                {sessionId
                                    ? `Session: ${sessionId.slice(0, 8)}...`
                                    : 'No active session'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchMemories}
                            disabled={!sessionId || isLoading}
                            className="p-2 rounded hover:bg-dark-700 text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            title="Refresh"
                        >
                            <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={clearMemories}
                            disabled={!sessionId || memories.length === 0}
                            className="p-2 rounded hover:bg-dark-700 text-gray-400 hover:text-red-400 transition-colors disabled:opacity-50"
                            title="Clear memories"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="card text-center">
                    <p className="text-3xl font-bold text-neon-cyan">{memories.length}</p>
                    <p className="text-sm text-gray-400">Total Memories</p>
                </div>
                <div className="card text-center">
                    <p className="text-3xl font-bold text-neon-green">
                        {sessionId ? '24h' : '--'}
                    </p>
                    <p className="text-sm text-gray-400">Retention</p>
                </div>
                <div className="card text-center">
                    <p className="text-3xl font-bold text-neon-magenta">
                        {sessionId ? 'Active' : 'None'}
                    </p>
                    <p className="text-sm text-gray-400">Session Status</p>
                </div>
            </div>

            {/* Memory List */}
            <div className="card">
                <h3 className="font-semibold text-white mb-4">Memory Timeline</h3>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
                        {error}
                    </div>
                )}

                {!sessionId ? (
                    <div className="text-center py-12 text-gray-500">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No active session</p>
                        <p className="text-sm mt-1">Start an analysis to create a session</p>
                    </div>
                ) : isLoading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="skeleton h-20 rounded-lg" />
                        ))}
                    </div>
                ) : memories.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                        <p>No memories yet</p>
                        <p className="text-sm mt-1">Your analysis history will appear here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <AnimatePresence>
                            {memories.map((memory, index) => (
                                <motion.div
                                    key={memory.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 20 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="memory-item p-4 rounded-lg bg-dark-700 border border-dark-600 hover:border-dark-500 transition-colors cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white line-clamp-2">
                                                {getContentPreview(memory.content)}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {formatTimestamp(memory.timestamp)}
                                            </p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-neon-cyan transition-colors flex-shrink-0 ml-3" />
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {/* Info */}
            <div className="text-center text-xs text-gray-500">
                <p>Memories are stored locally and persist across sessions for up to 24 hours.</p>
                <p className="mt-1">
                    The AI uses these memories to provide personalized, context-aware responses.
                </p>
            </div>
        </div>
    );
}
