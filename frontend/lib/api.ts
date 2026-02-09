/**
 * Helix Mind API Client
 * 
 * Handles communication with the FastAPI backend
 */

import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface AnalysisResult {
    session_id: string;
    result: string;
    thinking_trace: string[];
    charts: ChartData[];
    memory_context: MemoryItem[];
    timestamp: string;
}

export interface ChartData {
    type: string;
    title: string;
    html?: string;
    image_base64?: string;
    insights?: string;
    data?: any;
}

export interface MemoryItem {
    id: string;
    content: any;
    timestamp: string;
    relevance_score?: number;
}

export interface AnalyzeOptions {
    query: string;
    files?: File[];
    sessionId?: string;
    thinkingLevel?: 'none' | 'low' | 'high';
    onThinkingStep?: (step: string) => void;
}

/**
 * Analyze data with optional thinking callback
 */
export async function analyzeData(options: AnalyzeOptions): Promise<AnalysisResult> {
    const { query, files = [], sessionId, onThinkingStep } = options;

    // Create form data
    const formData = new FormData();
    formData.append('text', query);

    if (sessionId) {
        formData.append('session_id', sessionId);
    }

    files.forEach(file => {
        formData.append('files', file);
    });

    // Simulate thinking steps
    if (onThinkingStep) {
        const thinkingSteps = [
            '🔬 Initializing analysis pipeline...',
            '📄 Processing uploaded documents...',
            '🧬 Applying AI reasoning...',
            '📊 Generating visualizations...',
        ];
        for (const step of thinkingSteps) {
            onThinkingStep(step);
            await new Promise(r => setTimeout(r, 500));
        }
    }

    // Use regular endpoint (more stable than streaming)
    // NOTE: Do not set Content-Type header manually for FormData, let axios/browser set it with boundary
    const response = await axios.post<AnalysisResult>(`${API_BASE}/analyze`, formData, {
        timeout: 120000, // 2 minute timeout for AI processing
    });

    // Add thinking trace to callback
    if (onThinkingStep && response.data.thinking_trace) {
        for (const step of response.data.thinking_trace) {
            onThinkingStep(step);
        }
    }

    return response.data;
}

/**
 * Analyze with streaming thinking traces
 */
async function analyzeWithStreaming(
    formData: FormData,
    onThinkingStep: (step: string) => void
): Promise<AnalysisResult> {
    const response = await fetch(`${API_BASE}/analyze/stream`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let result: AnalysisResult = {
        session_id: '',
        result: '',
        thinking_trace: [],
        charts: [],
        memory_context: [],
        timestamp: new Date().toISOString(),
    };

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const data = JSON.parse(line.slice(6));

                    switch (data.type) {
                        case 'thinking':
                            result.thinking_trace.push(data.content);
                            onThinkingStep(data.content);
                            break;
                        case 'response':
                            result.result += data.content;
                            break;
                        case 'chart':
                            result.charts.push(data.content);
                            break;
                        case 'complete':
                            result.session_id = data.session_id;
                            break;
                    }
                } catch (e) {
                    // Skip invalid JSON
                }
            }
        }
    }

    return result;
}

/**
 * Get session memory
 */
export async function getMemory(sessionId: string, limit = 20): Promise<{
    session_id: string;
    memories: MemoryItem[];
    count: number;
}> {
    const response = await axios.get(`${API_BASE}/memory/${sessionId}`, {
        params: { limit },
    });
    return response.data;
}

/**
 * Clear session memory
 */
export async function clearMemory(sessionId: string): Promise<void> {
    await axios.delete(`${API_BASE}/memory/${sessionId}`);
}

/**
 * Generate a chart
 */
export async function generateChart(options: {
    data: any;
    type: string;
    title: string;
    sessionId?: string;
}): Promise<ChartData> {
    const response = await axios.post(`${API_BASE}/generate-chart`, options);
    return response.data;
}

/**
 * Generate a Mermaid diagram
 */
export async function generateDiagram(
    description: string,
    diagramType = 'flowchart'
): Promise<{
    diagram_type: string;
    mermaid_code: string;
    description: string;
    render_url: string;
}> {
    const formData = new FormData();
    formData.append('description', description);
    formData.append('diagram_type', diagramType);

    const response = await axios.post(`${API_BASE}/generate-diagram`, formData);
    return response.data;
}

/**
 * Add document to vector store
 */
export async function vectorizeDocument(
    file: File,
    metadata: Record<string, any> = {}
): Promise<{
    status: string;
    document_id: string;
    filename: string;
    chunks: number;
}> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('metadata', JSON.stringify(metadata));

    const response = await axios.post(`${API_BASE}/vectorize`, formData);
    return response.data;
}

/**
 * Search vector store
 */
export async function vectorSearch(
    query: string,
    limit = 5
): Promise<{
    query: string;
    results: MemoryItem[];
}> {
    const response = await axios.get(`${API_BASE}/vector-search`, {
        params: { query, limit },
    });
    return response.data;
}

/**
 * Check API health
 */
export async function checkHealth(): Promise<{
    status: string;
    service: string;
    version: string;
    gemini_model: string;
    features: string[];
}> {
    const response = await axios.get(`${API_BASE}/`);
    return response.data;
}
