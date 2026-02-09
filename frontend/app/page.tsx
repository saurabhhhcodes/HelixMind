'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dna,
    Brain,
    Upload,
    Sparkles,
    BarChart3,
    Clock,
    Zap,
    FileText,
    Image as ImageIcon,
    Video,
    ChevronRight,
    Settings,
    History,
    ChevronUp,
    ChevronDown
} from 'lucide-react';

import FileUpload from '@/components/FileUpload';
import ThinkingConsole from '@/components/ThinkingConsole';
import ResultsPanel from '@/components/ResultsPanel';
import ChartLab from '@/components/ChartLab';
import MemoryPanel from '@/components/MemoryPanel';
import { analyzeData, AnalysisResult } from '@/lib/api';

export default function Home() {
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [charts, setCharts] = useState<any[]>([]);
    const [activePanel, setActivePanel] = useState<'main' | 'memory' | 'settings'>('main');
    const [isDockMinimized, setIsDockMinimized] = useState(false);
    const [showDock, setShowDock] = useState(true);

    const handleFilesDropped = useCallback((newFiles: File[]) => {
        setFiles(prev => [...prev, ...newFiles]);
    }, []);

    const handleRemoveFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    // Auto-hide dock when result is displayed
    const handleResultDisplayed = useCallback(() => {
        setIsDockMinimized(true);
    }, []);

    // Reset dock visibility when starting new analysis
    useEffect(() => {
        if (isAnalyzing) {
            setShowDock(true);
        }
    }, [isAnalyzing]);

    const handleAnalyze = async () => {
        if (!query.trim() && files.length === 0) return;

        setIsAnalyzing(true);
        setThinkingSteps([]);
        setResult(null);
        setCharts([]);
        setIsDockMinimized(false);

        try {
            const response = await analyzeData({
                query,
                files,
                sessionId: sessionId || undefined,
                onThinkingStep: (step) => {
                    setThinkingSteps(prev => [...prev, step]);
                }
            });

            setSessionId(response.session_id);
            setResult(response);
            setCharts(response.charts || []);
        } catch (error) {
            console.error('Analysis failed:', error);
            setThinkingSteps(prev => [...prev, '❌ Analysis failed. Please try again.']);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
        if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
        return <FileText className="w-4 h-4" />;
    };

    const handleNewAnalysis = () => {
        setQuery('');
        setFiles([]);
        setResult(null);
        setCharts([]);
        setThinkingSteps([]);
        setIsDockMinimized(false);
    };

    return (
        <div className="min-h-screen flex flex-col bg-grid">
            {/* Header */}
            <header className="glass-strong border-b border-dark-600 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            initial={{ rotate: 0 }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                            className="relative"
                        >
                            <Dna className="w-10 h-10 text-neon-cyan" />
                            <div className="absolute inset-0 blur-lg bg-neon-cyan/30" />
                        </motion.div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">
                                Helix<span className="text-neon-cyan">Mind</span>
                            </h1>
                            <p className="text-xs text-gray-400">Autonomous Bio-Research Agent</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        {sessionId && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 px-3 py-1 rounded-full bg-dark-700 border border-dark-500"
                            >
                                <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
                                <span className="text-xs text-gray-300">Session Active</span>
                            </motion.div>
                        )}

                        <nav className="flex items-center gap-2">
                            <button
                                onClick={() => setActivePanel('main')}
                                className={`p-2 rounded-lg transition-colors ${activePanel === 'main'
                                    ? 'bg-neon-cyan/20 text-neon-cyan'
                                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                                    }`}
                            >
                                <Brain className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setActivePanel('memory')}
                                className={`p-2 rounded-lg transition-colors ${activePanel === 'memory'
                                    ? 'bg-neon-cyan/20 text-neon-cyan'
                                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                                    }`}
                            >
                                <History className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setActivePanel('settings')}
                                className={`p-2 rounded-lg transition-colors ${activePanel === 'settings'
                                    ? 'bg-neon-cyan/20 text-neon-cyan'
                                    : 'text-gray-400 hover:text-white hover:bg-dark-700'
                                    }`}
                            >
                                <Settings className="w-5 h-5" />
                            </button>
                        </nav>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
                <AnimatePresence mode="wait">
                    {activePanel === 'main' && (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Collapsible Input Dock */}
                            <motion.div
                                layout
                                className="relative"
                            >
                                {/* Minimized Dock Header */}
                                <AnimatePresence>
                                    {isDockMinimized && result && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="card mb-4 cursor-pointer"
                                            onClick={() => setIsDockMinimized(false)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30">
                                                        <Upload className="w-5 h-5 text-neon-cyan" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-white font-medium">Research Input</p>
                                                        <p className="text-xs text-gray-500">
                                                            {files.length > 0 ? `${files.length} file(s)` : 'No files'}
                                                            {query.trim() ? ` • Query: "${query.slice(0, 40)}${query.length > 40 ? '...' : ''}"` : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleNewAnalysis();
                                                        }}
                                                        className="px-3 py-1.5 text-xs text-neon-cyan border border-neon-cyan/30 rounded-lg hover:bg-neon-cyan/10 transition-colors"
                                                    >
                                                        New Analysis
                                                    </button>
                                                    <ChevronDown className="w-5 h-5 text-gray-400" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Full Input Dock */}
                                <AnimatePresence>
                                    {(!isDockMinimized || !result) && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            transition={{ duration: 0.3 }}
                                            className="space-y-4"
                                        >
                                            {/* Single Unified Input Card */}
                                            <motion.div
                                                className="card card-highlight p-6"
                                                initial={{ opacity: 0, scale: 0.95 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: 0.1 }}
                                            >
                                                {/* Header */}
                                                <div className="flex items-start gap-4 mb-6">
                                                    <div className="p-3 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 relative">
                                                        <Sparkles className="w-8 h-8 text-neon-cyan" />
                                                        <div className="absolute inset-0 blur-lg bg-neon-cyan/20" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <h2 className="text-xl font-semibold text-white mb-1">
                                                            Helix Mind Research Agent
                                                        </h2>
                                                        <p className="text-gray-400 text-sm">
                                                            Upload documents or ask questions about bio-research. AI analyzes with RAG + charts.
                                                        </p>
                                                    </div>
                                                    {result && (
                                                        <button
                                                            onClick={() => setIsDockMinimized(true)}
                                                            className="flex items-center gap-1 text-xs text-gray-400 hover:text-neon-cyan transition-colors"
                                                        >
                                                            <ChevronUp className="w-4 h-4" />
                                                            Minimize
                                                        </button>
                                                    )}
                                                </div>

                                                {/* Feature Tags */}
                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {[
                                                        { icon: Zap, label: 'Deep Reasoning', color: 'text-neon-cyan' },
                                                        { icon: BarChart3, label: 'Auto Charts', color: 'text-neon-orange' },
                                                        { icon: Clock, label: 'RAG Memory', color: 'text-neon-green' },
                                                        { icon: FileText, label: 'PDF+Image', color: 'text-neon-magenta' },
                                                    ].map((feature, i) => (
                                                        <div
                                                            key={i}
                                                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-dark-700 text-xs text-gray-300 border border-dark-600"
                                                        >
                                                            <feature.icon className={`w-3.5 h-3.5 ${feature.color}`} />
                                                            {feature.label}
                                                        </div>
                                                    ))}
                                                </div>

                                                {/* Query Input */}
                                                <textarea
                                                    value={query}
                                                    onChange={(e) => setQuery(e.target.value)}
                                                    placeholder="Ask about gene mutations, protein structures, analyze research papers... e.g., 'What are the implications of BRCA1 mutations?'"
                                                    className="w-full h-24 bg-dark-700 border border-dark-500 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan focus:ring-1 focus:ring-neon-cyan/30 transition-all resize-none mb-4"
                                                />

                                                {/* File Drop Zone - Compact */}
                                                <FileUpload
                                                    onFilesDropped={handleFilesDropped}
                                                    files={files}
                                                    onRemoveFile={handleRemoveFile}
                                                />

                                                {/* Uploaded Files Preview */}
                                                {files.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-4">
                                                        {files.map((file, i) => (
                                                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 text-xs">
                                                                {getFileIcon(file)}
                                                                <span className="text-neon-cyan max-w-[150px] truncate">{file.name}</span>
                                                                <button
                                                                    onClick={() => handleRemoveFile(i)}
                                                                    className="text-gray-400 hover:text-red-400"
                                                                >
                                                                    ×
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Analyze Button */}
                                                <button
                                                    onClick={handleAnalyze}
                                                    disabled={isAnalyzing || (!query.trim() && files.length === 0)}
                                                    className="btn-primary w-full flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isAnalyzing ? (
                                                        <>
                                                            <motion.div
                                                                animate={{ rotate: 360 }}
                                                                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                                                            >
                                                                <Brain className="w-5 h-5" />
                                                            </motion.div>
                                                            <span>Analyzing with AI...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Dna className="w-5 h-5" />
                                                            <span>Analyze</span>
                                                            <ChevronRight className="w-4 h-4" />
                                                        </>
                                                    )}
                                                </button>
                                            </motion.div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>

                            {/* Output Section */}
                            <div className="space-y-6">
                                {/* Thinking Console */}
                                <AnimatePresence>
                                    {(isAnalyzing || thinkingSteps.length > 0) && (
                                        <ThinkingConsole
                                            steps={thinkingSteps}
                                            isActive={isAnalyzing}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Results */}
                                <AnimatePresence>
                                    {result && (
                                        <ResultsPanel
                                            result={result}
                                            onResultDisplayed={handleResultDisplayed}
                                        />
                                    )}
                                </AnimatePresence>

                                {/* Charts */}
                                <AnimatePresence>
                                    {charts.length > 0 && (
                                        <ChartLab charts={charts} />
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div >
                    )
                    }

                    {
                        activePanel === 'memory' && (
                            <motion.div
                                key="memory"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                            >
                                <MemoryPanel sessionId={sessionId} />
                            </motion.div>
                        )
                    }

                    {
                        activePanel === 'settings' && (
                            <motion.div
                                key="settings"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="card max-w-2xl mx-auto"
                            >
                                <h2 className="text-xl font-semibold text-white mb-4">Settings</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-300 block mb-2">
                                            Thinking Level
                                        </label>
                                        <select className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neon-cyan">
                                            <option value="high">High (Maximum Reasoning)</option>
                                            <option value="low">Low (Faster Response)</option>
                                            <option value="none">None (Direct Response)</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="text-sm font-medium text-gray-300 block mb-2">
                                            Memory Retention
                                        </label>
                                        <select className="w-full bg-dark-700 border border-dark-500 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-neon-cyan">
                                            <option value="24">24 Hours</option>
                                            <option value="72">72 Hours</option>
                                            <option value="168">1 Week</option>
                                        </select>
                                    </div>

                                    <div className="pt-4 border-t border-dark-600">
                                        <p className="text-xs text-gray-500">
                                            Session ID: {sessionId || 'Not started'}
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        )
                    }
                </AnimatePresence >
            </div >

            {/* Footer */}
            < footer className="border-t border-dark-700 py-4" >
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-xs text-gray-500">
                        Powered by <span className="text-neon-cyan">Gemini 3 Pro</span> |
                        Gemini 3 Global Hackathon 2026
                    </p>
                </div>
            </footer >
        </div >
    );
}
