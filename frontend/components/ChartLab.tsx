'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, LineChart, PieChart, Grid3x3, Download, Expand, Minimize2, ChevronLeft, ChevronRight, Lightbulb, TrendingUp, Activity } from 'lucide-react';
import dynamic from 'next/dynamic';

// Dynamically import Plotly to avoid SSR issues
const Plot = dynamic(() => import('react-plotly.js'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-[300px]">
            <div className="animate-pulse text-gray-400">Loading chart...</div>
        </div>
    )
}) as any;

interface ChartLabProps {
    charts: ChartData[];
}

interface ChartData {
    type: string;
    title: string;
    html?: string;
    image_base64?: string;
    insights?: string;
    data?: {
        labels?: string[];
        values?: number[];
        x?: any[];
        y?: any[];
        z?: any[][];
        x_labels?: string[];
        y_labels?: string[];
        sizes?: number[];
        colors?: string[];
        categories?: string[];
    };
    mermaid?: string;
}

// Neon color palette
const COLORS = {
    primary: '#00f5ff',
    secondary: '#ff00ff',
    accent: '#00ff88',
    warning: '#ffaa00',
    background: '#111118',
    grid: '#333340',
    text: '#ffffff'
};

const COLOR_PALETTE = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, '#ff6b6b', '#4ecdc4', '#a29bfe'];

export default function ChartLab({ charts }: ChartLabProps) {
    const [activeChart, setActiveChart] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const getChartIcon = (type: string) => {
        switch (type) {
            case 'line': return <LineChart className="w-4 h-4" />;
            case 'pie': return <PieChart className="w-4 h-4" />;
            case 'heatmap': return <Grid3x3 className="w-4 h-4" />;
            case 'scatter': return <Activity className="w-4 h-4" />;
            default: return <BarChart3 className="w-4 h-4" />;
        }
    };

    const getChartColor = (type: string) => {
        switch (type) {
            case 'line': return 'text-neon-cyan';
            case 'pie': return 'text-neon-magenta';
            case 'heatmap': return 'text-neon-orange';
            case 'scatter': return 'text-neon-green';
            default: return 'text-neon-orange';
        }
    };

    const buildPlotlyConfig = (chart: ChartData) => {
        const data = chart.data || {};
        const chartType = chart.type;

        const layout: any = {
            title: {
                text: chart.title,
                font: { color: COLORS.primary, size: 16, family: 'Inter, sans-serif' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { color: COLORS.text, family: 'Inter, sans-serif' },
            margin: { l: 50, r: 30, t: 50, b: 50 },
            xaxis: {
                gridcolor: COLORS.grid,
                linecolor: COLORS.grid,
                tickfont: { color: COLORS.text },
                title: { font: { color: COLORS.text } }
            },
            yaxis: {
                gridcolor: COLORS.grid,
                linecolor: COLORS.grid,
                tickfont: { color: COLORS.text },
                title: { font: { color: COLORS.text } }
            },
            showlegend: chartType === 'pie',
            legend: {
                font: { color: COLORS.text },
                bgcolor: 'rgba(0,0,0,0.5)'
            },
            autosize: true,
        };

        let traces: any[] = [];

        switch (chartType) {
            case 'bar':
                traces = [{
                    type: 'bar',
                    x: data.labels || data.x || [],
                    y: data.values || data.y || [],
                    marker: {
                        color: data.values?.map((_, i) => COLOR_PALETTE[i % COLOR_PALETTE.length]) || COLORS.primary,
                        line: { color: COLORS.secondary, width: 1 }
                    },
                    hoverinfo: 'x+y',
                    hoverlabel: { bgcolor: COLORS.background, font: { color: COLORS.text } }
                }];
                break;

            case 'line':
                traces = [{
                    type: 'scatter',
                    mode: 'lines+markers',
                    x: data.x || data.labels || [],
                    y: data.y || data.values || [],
                    line: { color: COLORS.primary, width: 3 },
                    marker: { color: COLORS.secondary, size: 8, line: { color: COLORS.primary, width: 2 } },
                    fill: 'tozeroy',
                    fillcolor: 'rgba(0, 245, 255, 0.1)',
                    hoverinfo: 'x+y',
                    hoverlabel: { bgcolor: COLORS.background, font: { color: COLORS.text } }
                }];
                break;

            case 'scatter':
                traces = [{
                    type: 'scatter',
                    mode: 'markers',
                    x: data.x || [],
                    y: data.y || [],
                    marker: {
                        size: data.sizes || 12,
                        color: COLORS.primary,
                        line: { color: COLORS.secondary, width: 1 },
                        opacity: 0.8
                    },
                    hoverinfo: 'x+y',
                    hoverlabel: { bgcolor: COLORS.background, font: { color: COLORS.text } }
                }];
                break;

            case 'pie':
                traces = [{
                    type: 'pie',
                    labels: data.labels || [],
                    values: data.values || [],
                    marker: {
                        colors: COLOR_PALETTE.slice(0, (data.labels?.length || 4)),
                        line: { color: COLORS.background, width: 2 }
                    },
                    hole: 0.4,
                    textinfo: 'label+percent',
                    textfont: { color: COLORS.text },
                    hoverinfo: 'label+value+percent',
                    hoverlabel: { bgcolor: COLORS.background, font: { color: COLORS.text } }
                }];
                layout.showlegend = true;
                break;

            case 'heatmap':
                traces = [{
                    type: 'heatmap',
                    z: data.z || data.values || [[]],
                    x: data.x || data.x_labels || [],
                    y: data.y || data.y_labels || [],
                    colorscale: [
                        [0, COLORS.background],
                        [0.5, COLORS.primary],
                        [1, COLORS.secondary]
                    ],
                    hoverinfo: 'x+y+z',
                    hoverlabel: { bgcolor: COLORS.background, font: { color: COLORS.text } }
                }];
                break;

            case 'radar':
                const categories = data.categories || data.labels || [];
                const values = data.values || [];
                traces = [{
                    type: 'scatterpolar',
                    r: [...values, values[0]], // Close the polygon
                    theta: [...categories, categories[0]],
                    fill: 'toself',
                    fillcolor: 'rgba(0, 245, 255, 0.2)',
                    line: { color: COLORS.primary, width: 2 },
                    marker: { color: COLORS.secondary, size: 6 }
                }];
                layout.polar = {
                    radialaxis: { visible: true, range: [0, Math.max(...values) * 1.2], gridcolor: COLORS.grid, tickfont: { color: COLORS.text } },
                    angularaxis: { gridcolor: COLORS.grid, tickfont: { color: COLORS.text } },
                    bgcolor: 'rgba(0,0,0,0)'
                };
                break;

            default:
                // Default to bar
                traces = [{
                    type: 'bar',
                    x: data.labels || data.x || ['A', 'B', 'C'],
                    y: data.values || data.y || [1, 2, 3],
                    marker: { color: COLORS.primary }
                }];
        }

        return { data: traces, layout };
    };

    const handleDownload = () => {
        const chart = charts[activeChart];
        if (chart.image_base64) {
            const link = document.createElement('a');
            link.href = `data:image/png;base64,${chart.image_base64}`;
            link.download = `${chart.title.replace(/\s+/g, '_')}.png`;
            link.click();
        }
    };

    const goToPrevChart = () => {
        setActiveChart((prev) => (prev > 0 ? prev - 1 : charts.length - 1));
    };

    const goToNextChart = () => {
        setActiveChart((prev) => (prev < charts.length - 1 ? prev + 1 : 0));
    };

    if (charts.length === 0) return null;

    const currentChart = charts[activeChart];
    const plotConfig = currentChart?.data ? buildPlotlyConfig(currentChart) : null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`card relative ${isExpanded ? 'fixed inset-4 z-50 overflow-auto' : ''}`}
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <TrendingUp className="w-5 h-5 text-neon-orange" />
                        <div className="absolute inset-0 blur-sm bg-neon-orange/30" />
                    </div>
                    <h3 className="font-semibold text-white">Visualizations</h3>
                    <span className="px-2 py-0.5 rounded-full bg-neon-orange/20 text-neon-orange text-xs font-medium border border-neon-orange/30">
                        {charts.length} {charts.length === 1 ? 'chart' : 'charts'}
                    </span>
                </div>

                <div className="flex items-center gap-1">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleDownload}
                        className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                        title="Download chart"
                    >
                        <Download className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="p-2 rounded-lg hover:bg-dark-700 text-gray-400 hover:text-white transition-colors"
                        title={isExpanded ? 'Minimize' : 'Expand'}
                    >
                        {isExpanded ? (
                            <Minimize2 className="w-4 h-4" />
                        ) : (
                            <Expand className="w-4 h-4" />
                        )}
                    </motion.button>
                </div>
            </div>

            {/* Chart tabs */}
            {charts.length > 1 && (
                <div className="flex items-center gap-2 mb-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={goToPrevChart}
                        className="p-1.5 rounded-lg bg-dark-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </motion.button>

                    <div className="flex-1 flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                        {charts.map((chart, index) => (
                            <motion.button
                                key={index}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setActiveChart(index)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${activeChart === index
                                    ? 'bg-gradient-to-r from-neon-cyan/20 to-neon-magenta/20 text-white border border-neon-cyan/50 shadow-lg shadow-neon-cyan/10'
                                    : 'bg-dark-700 text-gray-400 hover:text-white border border-transparent hover:border-dark-500'
                                    }`}
                            >
                                <span className={getChartColor(chart.type)}>
                                    {getChartIcon(chart.type)}
                                </span>
                                <span className="max-w-[120px] truncate">{chart.title}</span>
                            </motion.button>
                        ))}
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={goToNextChart}
                        className="p-1.5 rounded-lg bg-dark-700 text-gray-400 hover:text-white transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </motion.button>
                </div>
            )}

            {/* Chart display */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeChart}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="rounded-xl border border-dark-600 bg-dark-700/50 overflow-hidden"
                >
                    {isClient && plotConfig ? (
                        <Plot
                            data={plotConfig.data}
                            layout={{
                                ...plotConfig.layout,
                                height: isExpanded ? 500 : 350,
                            }}
                            config={{
                                displayModeBar: true,
                                responsive: true,
                                displaylogo: false,
                                modeBarButtonsToRemove: ['lasso2d', 'select2d', 'autoScale2d'],
                                toImageButtonOptions: {
                                    format: 'png',
                                    filename: currentChart.title.replace(/\s+/g, '_'),
                                    height: 600,
                                    width: 900,
                                    scale: 2
                                }
                            }}
                            style={{ width: '100%' }}
                        />
                    ) : currentChart?.image_base64 ? (
                        <img
                            src={`data:image/png;base64,${currentChart.image_base64}`}
                            alt={currentChart.title}
                            className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center h-[300px] text-gray-500">
                            <BarChart3 className="w-12 h-12 mb-3 opacity-40" />
                            <p className="font-medium">{currentChart?.title}</p>
                            <p className="text-xs mt-1 text-gray-600">Visualization loading...</p>
                        </div>
                    )}
                </motion.div>
            </AnimatePresence>

            {/* Insights */}
            <AnimatePresence>
                {currentChart?.insights && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 p-4 rounded-lg bg-gradient-to-r from-neon-cyan/5 to-neon-magenta/5 border border-dark-600"
                    >
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 flex-shrink-0">
                                <Lightbulb className="w-4 h-4 text-neon-cyan" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-neon-cyan mb-1 uppercase tracking-wide">Key Insight</p>
                                <p className="text-sm text-gray-300 leading-relaxed">
                                    {currentChart.insights}
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Chart indicator dots */}
            {charts.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                    {charts.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setActiveChart(index)}
                            className={`h-2 rounded-full transition-all duration-300 ${activeChart === index
                                ? 'bg-gradient-to-r from-neon-cyan to-neon-magenta w-8'
                                : 'bg-dark-500 hover:bg-dark-400 w-2'
                                }`}
                        />
                    ))}
                </div>
            )}

            {/* Expanded backdrop */}
            {isExpanded && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/80 -z-10"
                    onClick={() => setIsExpanded(false)}
                />
            )}
        </motion.div>
    );
}
