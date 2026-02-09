"""
Chart Generator - Dynamic Visualization with Plotly + Mermaid

Features:
- Auto-generate charts from analysis data
- Mermaid diagram generation from descriptions
- Code execution for custom visualizations
- Export to multiple formats
"""

import json
import base64
from typing import Dict, Any, Optional
from io import BytesIO

import plotly.graph_objects as go
import plotly.express as px
from plotly.subplots import make_subplots


class ChartGenerator:
    """Dynamic chart and diagram generator."""
    
    def __init__(self, gemini_client=None):
        """Initialize the chart generator."""
        self.gemini_client = gemini_client
        
        # Default color scheme (Neon theme)
        self.colors = {
            "primary": "#00f5ff",      # Cyan
            "secondary": "#ff00ff",    # Magenta
            "accent": "#00ff88",       # Green
            "warning": "#ffaa00",      # Orange
            "background": "#111118",   # Dark
            "text": "#ffffff"          # White
        }
        
        # Chart type mappings
        self.chart_types = {
            "bar": self._create_bar_chart,
            "line": self._create_line_chart,
            "scatter": self._create_scatter_chart,
            "heatmap": self._create_heatmap,
            "pie": self._create_pie_chart,
            "radar": self._create_radar_chart,
        }
    
    async def generate(self, chart_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a chart from data specification.
        
        Args:
            chart_data: Dict with type, title, data, and optional config
            
        Returns:
            Dict with chart HTML, image data, and metadata
        """
        chart_type = chart_data.get("type", "bar")
        title = chart_data.get("title", "Analysis Chart")
        data = chart_data.get("data", {})
        
        # Ensure we have valid data
        if not data:
            data = {"labels": ["No Data"], "values": [0]}
        
        # Get the appropriate chart creator
        creator = self.chart_types.get(chart_type, self._create_bar_chart)
        
        try:
            # Create the figure
            fig = creator(data, title)
            
            # Apply dark theme
            fig = self._apply_theme(fig)
            
            # Generate interactive HTML (always works)
            html = fig.to_html(
                include_plotlyjs="cdn", 
                full_html=False,
                config={
                    'displayModeBar': True,
                    'responsive': True,
                    'displaylogo': False,
                    'modeBarButtonsToRemove': ['lasso2d', 'select2d']
                }
            )
            
            # Try to generate static image (may fail without kaleido)
            img_base64 = None
            try:
                img_bytes = fig.to_image(format="png", width=800, height=500, scale=2)
                img_base64 = base64.b64encode(img_bytes).decode()
            except Exception as e:
                print(f"Static image generation skipped: {e}")
            
            return {
                "type": chart_type,
                "title": title,
                "html": html,
                "image_base64": img_base64,
                "insights": chart_data.get("insights", ""),
                "data": data  # Include original data for frontend fallback
            }
        except Exception as e:
            print(f"Chart generation error: {e}")
            # Return minimal chart info
            return {
                "type": chart_type,
                "title": title,
                "html": None,
                "image_base64": None,
                "insights": chart_data.get("insights", ""),
                "data": data,
                "error": str(e)
            }
    
    def _create_bar_chart(self, data: Dict[str, Any], title: str) -> go.Figure:
        """Create a bar chart."""
        labels = data.get("labels", [])
        values = data.get("values", [])
        
        fig = go.Figure(data=[
            go.Bar(
                x=labels,
                y=values,
                marker_color=self.colors["primary"],
                marker_line_color=self.colors["secondary"],
                marker_line_width=2
            )
        ])
        
        fig.update_layout(title=title)
        return fig
    
    def _create_line_chart(self, data: Dict[str, Any], title: str) -> go.Figure:
        """Create a line chart."""
        x = data.get("x", data.get("labels", []))
        y = data.get("y", data.get("values", []))
        
        fig = go.Figure(data=[
            go.Scatter(
                x=x,
                y=y,
                mode='lines+markers',
                line=dict(color=self.colors["primary"], width=3),
                marker=dict(color=self.colors["secondary"], size=10)
            )
        ])
        
        fig.update_layout(title=title)
        return fig
    
    def _create_scatter_chart(self, data: Dict[str, Any], title: str) -> go.Figure:
        """Create a scatter plot."""
        x = data.get("x", [])
        y = data.get("y", [])
        sizes = data.get("sizes", [10] * len(x))
        colors = data.get("colors", [self.colors["primary"]] * len(x))
        
        fig = go.Figure(data=[
            go.Scatter(
                x=x,
                y=y,
                mode='markers',
                marker=dict(
                    size=sizes,
                    color=colors,
                    line=dict(color=self.colors["secondary"], width=1)
                )
            )
        ])
        
        fig.update_layout(title=title)
        return fig
    
    def _create_heatmap(self, data: Dict[str, Any], title: str) -> go.Figure:
        """Create a heatmap."""
        z = data.get("z", data.get("values", [[]]))
        x = data.get("x", data.get("x_labels", None))
        y = data.get("y", data.get("y_labels", None))
        
        fig = go.Figure(data=[
            go.Heatmap(
                z=z,
                x=x,
                y=y,
                colorscale=[
                    [0, self.colors["background"]],
                    [0.5, self.colors["primary"]],
                    [1, self.colors["secondary"]]
                ]
            )
        ])
        
        fig.update_layout(title=title)
        return fig
    
    def _create_pie_chart(self, data: Dict[str, Any], title: str) -> go.Figure:
        """Create a pie chart."""
        labels = data.get("labels", [])
        values = data.get("values", [])
        
        colors = [self.colors["primary"], self.colors["secondary"], 
                  self.colors["accent"], self.colors["warning"]]
        
        fig = go.Figure(data=[
            go.Pie(
                labels=labels,
                values=values,
                marker_colors=colors[:len(labels)],
                textfont=dict(color=self.colors["text"]),
                hole=0.4  # Donut style
            )
        ])
        
        fig.update_layout(title=title)
        return fig
    
    def _create_radar_chart(self, data: Dict[str, Any], title: str) -> go.Figure:
        """Create a radar/spider chart."""
        categories = data.get("categories", data.get("labels", []))
        values = data.get("values", [])
        
        fig = go.Figure(data=[
            go.Scatterpolar(
                r=values,
                theta=categories,
                fill='toself',
                fillcolor=f"rgba(0, 245, 255, 0.3)",
                line=dict(color=self.colors["primary"], width=2)
            )
        ])
        
        fig.update_layout(
            title=title,
            polar=dict(
                radialaxis=dict(
                    visible=True,
                    range=[0, max(values) * 1.2] if values else [0, 1]
                ),
                bgcolor=self.colors["background"]
            )
        )
        return fig
    
    def _apply_theme(self, fig: go.Figure) -> go.Figure:
        """Apply the dark neon theme to a figure."""
        fig.update_layout(
            paper_bgcolor=self.colors["background"],
            plot_bgcolor=self.colors["background"],
            font=dict(
                family="Inter, sans-serif",
                size=14,
                color=self.colors["text"]
            ),
            title=dict(
                font=dict(size=20, color=self.colors["primary"])
            ),
            xaxis=dict(
                gridcolor="#333340",
                linecolor="#333340",
                tickfont=dict(color=self.colors["text"])
            ),
            yaxis=dict(
                gridcolor="#333340",
                linecolor="#333340",
                tickfont=dict(color=self.colors["text"])
            ),
            margin=dict(l=40, r=40, t=60, b=40),
            showlegend=True,
            legend=dict(
                bgcolor="rgba(0,0,0,0.5)",
                font=dict(color=self.colors["text"])
            )
        )
        return fig
    
    async def generate_mermaid(
        self, 
        description: str, 
        diagram_type: str = "flowchart"
    ) -> Dict[str, Any]:
        """
        Generate a Mermaid diagram from natural language.
        
        Args:
            description: Natural language description of the diagram
            diagram_type: Type of diagram (flowchart, sequence, class, etc.)
            
        Returns:
            Dict with Mermaid code and metadata
        """
        # If Gemini client available, use it to generate
        if self.gemini_client and not self.gemini_client.mock_mode:
            prompt = f"""Generate a Mermaid {diagram_type} diagram for:
{description}

Return ONLY the Mermaid code, no explanations. Start with the diagram type declaration."""
            
            result = await self.gemini_client.analyze({
                "query": prompt
            }, thinking_level="low")
            
            mermaid_code = result["response"].strip()
            
            # Clean up code blocks if present
            if "```mermaid" in mermaid_code:
                mermaid_code = mermaid_code.split("```mermaid")[1].split("```")[0].strip()
            elif "```" in mermaid_code:
                mermaid_code = mermaid_code.split("```")[1].split("```")[0].strip()
        else:
            # Generate basic template
            mermaid_code = self._generate_basic_mermaid(description, diagram_type)
        
        return {
            "diagram_type": diagram_type,
            "mermaid_code": mermaid_code,
            "description": description,
            "render_url": f"https://mermaid.ink/img/{base64.urlsafe_b64encode(mermaid_code.encode()).decode()}"
        }
    
    def _generate_basic_mermaid(self, description: str, diagram_type: str) -> str:
        """Generate a basic Mermaid diagram template."""
        if diagram_type == "flowchart":
            return """flowchart TD
    A[Input Data] --> B{Analysis Engine}
    B --> C[Pattern Recognition]
    B --> D[Anomaly Detection]
    C --> E[Hypothesis Generation]
    D --> E
    E --> F[Research Output]"""
        
        elif diagram_type == "sequence":
            return """sequenceDiagram
    participant U as User
    participant H as Helix Mind
    participant G as Gemini 3
    participant M as Memory
    
    U->>H: Upload Data
    H->>G: Multimodal Analysis
    G-->>H: Thinking Trace + Results
    H->>M: Store in Memory
    H-->>U: Insights + Visualizations"""
        
        elif diagram_type == "class":
            return """classDiagram
    class HelixMind {
        +analyze()
        +remember()
        +visualize()
    }
    class GeminiClient {
        +multimodalAnalysis()
        +thinkingTrace()
    }
    class VectorStore {
        +embed()
        +search()
    }
    HelixMind --> GeminiClient
    HelixMind --> VectorStore"""
        
        else:
            return """flowchart LR
    A[Start] --> B[Process] --> C[End]"""
    
    async def create_gene_expression_heatmap(
        self, 
        gene_names: list, 
        sample_names: list, 
        values: list
    ) -> Dict[str, Any]:
        """Create a specialized gene expression heatmap."""
        data = {
            "z": values,
            "x": sample_names,
            "y": gene_names
        }
        
        return await self.generate({
            "type": "heatmap",
            "title": "Gene Expression Analysis",
            "data": data,
            "insights": f"Heatmap showing expression of {len(gene_names)} genes across {len(sample_names)} samples"
        })
    
    async def create_protein_structure_plot(
        self, 
        residues: list, 
        properties: Dict[str, list]
    ) -> Dict[str, Any]:
        """Create a protein structure property plot."""
        fig = make_subplots(rows=len(properties), cols=1, shared_xaxes=True)
        
        colors = [self.colors["primary"], self.colors["secondary"], 
                  self.colors["accent"], self.colors["warning"]]
        
        for i, (prop_name, values) in enumerate(properties.items()):
            fig.add_trace(
                go.Scatter(
                    x=residues,
                    y=values,
                    name=prop_name,
                    line=dict(color=colors[i % len(colors)])
                ),
                row=i+1, col=1
            )
        
        fig = self._apply_theme(fig)
        fig.update_layout(height=150 * len(properties) + 100)
        
        html = fig.to_html(include_plotlyjs="cdn", full_html=False)
        
        return {
            "type": "protein_structure",
            "title": "Protein Property Analysis",
            "html": html,
            "config": fig.to_json()
        }
