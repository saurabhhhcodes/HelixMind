'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Copy, Check, ExternalLink, BarChart3, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { AnalysisResult } from '@/lib/api';

interface ResultsPanelProps {
    result: AnalysisResult;
    onResultDisplayed?: () => void;
}

// Initialize mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'dark',
    themeVariables: {
        primaryColor: '#00f5ff',
        primaryTextColor: '#ffffff',
        primaryBorderColor: '#00f5ff',
        lineColor: '#00f5ff',
        secondaryColor: '#ff00ff',
        tertiaryColor: '#1a1a24',
        background: '#111118',
        mainBkg: '#1a1a24',
        secondBkg: '#222230',
        nodeBorder: '#00f5ff',
        clusterBkg: '#1a1a24',
        titleColor: '#00f5ff',
        edgeLabelBackground: '#1a1a24',
    },
    fontFamily: 'JetBrains Mono, monospace',
});

export default function ResultsPanel({ result, onResultDisplayed }: ResultsPanelProps) {
    const [copied, setCopied] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const mermaidRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(result.result);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Notify parent when result is displayed
    useEffect(() => {
        if (result && onResultDisplayed) {
            onResultDisplayed();
        }
    }, [result, onResultDisplayed]);

    // Render mermaid diagrams
    useEffect(() => {
        const renderMermaid = async () => {
            if (contentRef.current) {
                const mermaidBlocks = contentRef.current.querySelectorAll('.mermaid-diagram');
                for (let i = 0; i < mermaidBlocks.length; i++) {
                    const block = mermaidBlocks[i] as HTMLElement;
                    const code = block.getAttribute('data-mermaid');
                    if (code && !block.querySelector('svg')) {
                        try {
                            const id = `mermaid-${Date.now()}-${i}`;
                            const { svg } = await mermaid.render(id, code);
                            block.innerHTML = svg;
                        } catch (error) {
                            console.error('Mermaid render error:', error);
                            block.innerHTML = `<div class="text-red-400 text-sm">Diagram rendering failed</div>`;
                        }
                    }
                }
            }
        };
        renderMermaid();
    }, [result.result, isExpanded]);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className={`card card-highlight relative ${isFullscreen ? 'fixed inset-4 z-50 overflow-hidden' : ''}`}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <FileText className="w-5 h-5 text-neon-magenta" />
                            <div className="absolute inset-0 blur-sm bg-neon-magenta/30" />
                        </div>
                        <h3 className="font-semibold text-white">Analysis Results</h3>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-2 py-0.5 rounded-full bg-neon-green/20 text-neon-green text-xs font-medium"
                        >
                            Complete
                        </motion.div>
                    </div>

                    <div className="flex items-center gap-1">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleCopy}
                            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                            title="Copy to clipboard"
                        >
                            {copied ? (
                                <Check className="w-4 h-4 text-neon-green" />
                            ) : (
                                <Copy className="w-4 h-4" />
                            )}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                            title={isExpanded ? 'Collapse' : 'Expand'}
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
                        >
                            {isFullscreen ? (
                                <Minimize2 className="w-4 h-4" />
                            ) : (
                                <Maximize2 className="w-4 h-4" />
                            )}
                        </motion.button>
                    </div>
                </div>

                {/* Content */}
                <motion.div
                    ref={contentRef}
                    className={`markdown-content overflow-y-auto pr-2 custom-scrollbar ${isExpanded || isFullscreen ? 'max-h-[70vh]' : 'max-h-96'}`}
                    animate={{ height: isExpanded || isFullscreen ? 'auto' : 'auto' }}
                >
                    <ReactMarkdown
                        components={{
                            h1: ({ children }) => (
                                <h1 className="text-xl font-bold text-neon-cyan mt-4 mb-2 flex items-center gap-2">
                                    <span className="w-1 h-6 bg-neon-cyan rounded" />
                                    {children}
                                </h1>
                            ),
                            h2: ({ children }) => (
                                <h2 className="text-lg font-semibold text-neon-cyan mt-3 mb-2 flex items-center gap-2">
                                    <span className="w-0.5 h-5 bg-neon-cyan/70 rounded" />
                                    {children}
                                </h2>
                            ),
                            h3: ({ children }) => (
                                <h3 className="text-base font-semibold text-neon-cyan mt-2 mb-1">{children}</h3>
                            ),
                            p: ({ children }) => (
                                <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>
                            ),
                            ul: ({ children }) => (
                                <ul className="list-none mb-3 space-y-2">{children}</ul>
                            ),
                            ol: ({ children }) => (
                                <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>
                            ),
                            li: ({ children }) => (
                                <li className="text-gray-300 flex items-start gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan mt-2 flex-shrink-0" />
                                    <span>{children}</span>
                                </li>
                            ),
                            code: ({ className, children }) => {
                                const match = /language-(\w+)/.exec(className || '');
                                const language = match ? match[1] : '';
                                const code = String(children).replace(/\n$/, '');

                                // Handle mermaid code blocks
                                if (language === 'mermaid') {
                                    return (
                                        <div className="my-4 p-4 bg-dark-700 rounded-xl border border-dark-500 overflow-x-auto">
                                            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-dark-600">
                                                <BarChart3 className="w-4 h-4 text-neon-orange" />
                                                <span className="text-xs text-gray-400 font-medium">Diagram</span>
                                            </div>
                                            <div
                                                className="mermaid-diagram flex justify-center items-center min-h-[200px]"
                                                data-mermaid={code}
                                            />
                                        </div>
                                    );
                                }

                                // Regular code blocks
                                if (className?.includes('language-')) {
                                    return (
                                        <div className="my-3 rounded-xl overflow-hidden border border-dark-600">
                                            <div className="flex items-center justify-between px-4 py-2 bg-dark-600 border-b border-dark-500">
                                                <span className="text-xs text-gray-400 font-mono">{language || 'code'}</span>
                                                <button
                                                    onClick={() => navigator.clipboard.writeText(code)}
                                                    className="text-xs text-gray-400 hover:text-white transition-colors"
                                                >
                                                    Copy
                                                </button>
                                            </div>
                                            <pre className="bg-dark-700 p-4 overflow-x-auto">
                                                <code className="text-sm font-mono text-gray-300">{children}</code>
                                            </pre>
                                        </div>
                                    );
                                }

                                // Inline code
                                return (
                                    <code className="bg-dark-700 px-1.5 py-0.5 rounded text-neon-cyan text-sm font-mono">
                                        {children}
                                    </code>
                                );
                            },
                            blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-neon-cyan pl-4 my-3 italic text-gray-400 bg-dark-700/50 py-2 rounded-r-lg">
                                    {children}
                                </blockquote>
                            ),
                            strong: ({ children }) => (
                                <strong className="font-semibold text-white">{children}</strong>
                            ),
                            a: ({ href, children }) => (
                                <a
                                    href={href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-neon-cyan hover:underline inline-flex items-center gap-1 hover:text-neon-green transition-colors"
                                >
                                    {children}
                                    <ExternalLink className="w-3 h-3" />
                                </a>
                            ),
                            table: ({ children }) => (
                                <div className="my-4 overflow-x-auto rounded-lg border border-dark-600">
                                    <table className="w-full text-sm">{children}</table>
                                </div>
                            ),
                            thead: ({ children }) => (
                                <thead className="bg-dark-700 text-neon-cyan">{children}</thead>
                            ),
                            th: ({ children }) => (
                                <th className="px-4 py-2 text-left font-semibold border-b border-dark-600">{children}</th>
                            ),
                            td: ({ children }) => (
                                <td className="px-4 py-2 text-gray-300 border-b border-dark-600">{children}</td>
                            ),
                            hr: () => (
                                <hr className="my-4 border-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/50 to-transparent" />
                            ),
                        }}
                    >
                        {result.result}
                    </ReactMarkdown>
                </motion.div>

                {/* Metadata */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="mt-4 pt-4 border-t border-dark-600 flex flex-wrap gap-4 text-xs text-gray-500"
                >
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan" />
                        Session: {result.session_id.slice(0, 8)}...
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-green" />
                        Time: {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                    {result.memory_context && result.memory_context.length > 0 && (
                        <span className="flex items-center gap-1 text-neon-green">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
                            +{result.memory_context.length} memory items used
                        </span>
                    )}
                </motion.div>

                {/* Fullscreen backdrop */}
                {isFullscreen && (
                    <div
                        className="fixed inset-0 bg-black/80 -z-10"
                        onClick={() => setIsFullscreen(false)}
                    />
                )}
            </motion.div>
        </AnimatePresence>
    );
}
