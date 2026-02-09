'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Lightbulb, Search, FlaskConical, CheckCircle2 } from 'lucide-react';

interface ThinkingConsoleProps {
    steps: string[];
    isActive: boolean;
}

export default function ThinkingConsole({ steps, isActive }: ThinkingConsoleProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [steps]);

    const getStepIcon = (step: string) => {
        if (step.includes('🔬') || step.includes('Analyz')) return <FlaskConical className="w-4 h-4" />;
        if (step.includes('🧬') || step.includes('pattern')) return <Search className="w-4 h-4" />;
        if (step.includes('💡') || step.includes('hypothesi')) return <Lightbulb className="w-4 h-4" />;
        if (step.includes('✓') || step.includes('Complete')) return <CheckCircle2 className="w-4 h-4" />;
        return <Brain className="w-4 h-4" />;
    };

    const getStepColor = (step: string) => {
        if (step.includes('❌') || step.includes('fail')) return 'text-red-400';
        if (step.includes('✓') || step.includes('Complete')) return 'text-neon-green';
        if (step.includes('💡')) return 'text-neon-orange';
        return 'text-neon-cyan';
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-neon-cyan" />
                    <h3 className="font-semibold text-white">Thinking Console</h3>
                </div>

                {isActive && (
                    <div className="flex items-center gap-2">
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-neon-cyan"
                        />
                        <span className="text-xs text-neon-cyan">Reasoning...</span>
                    </div>
                )}
            </div>

            <div
                ref={containerRef}
                className="thinking-console rounded-lg p-4 h-64 overflow-y-auto space-y-3"
            >
                {steps.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-gray-500 text-sm">
                        <div className="text-center">
                            <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p>Waiting for analysis...</p>
                            <p className="text-xs mt-1">Thinking traces will appear here</p>
                        </div>
                    </div>
                ) : (
                    <AnimatePresence>
                        {steps.map((step, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className="thinking-step flex items-start gap-3"
                            >
                                <div className={`p-1 rounded ${getStepColor(step)} bg-dark-700`}>
                                    {getStepIcon(step)}
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-mono ${getStepColor(step)}`}>
                                        {step}
                                    </p>
                                    <p className="text-xs text-gray-600 mt-0.5">
                                        Step {index + 1}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                )}

                {/* Cursor */}
                {isActive && (
                    <div className="flex items-center gap-2 mt-2">
                        <span className="thinking-cursor" />
                    </div>
                )}
            </div>

            {/* Footer info */}
            <div className="mt-3 pt-3 border-t border-dark-600 flex items-center justify-between text-xs text-gray-500">
                <span>{steps.length} thinking steps</span>
                <span>thinking_level: high</span>
            </div>
        </motion.div>
    );
}
