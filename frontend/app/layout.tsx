import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Helix Mind | Autonomous Bio-Research Agent',
    description: 'AI-powered multimodal research assistant with deep reasoning, powered by Gemini 3',
    keywords: ['AI', 'Research', 'Biotech', 'Gemini 3', 'Multimodal', 'Deep Reasoning'],
    authors: [{ name: 'Helix Mind Team' }],
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.ico" />
                <meta name="theme-color" content="#0a0a0f" />
            </head>
            <body className="bg-dark-900 text-white antialiased">
                {/* Background grid */}
                <div className="fixed inset-0 bg-grid opacity-50 pointer-events-none" />

                {/* Radial gradient overlay */}
                <div className="fixed inset-0 bg-gradient-radial from-dark-800/50 via-dark-900 to-dark-900 pointer-events-none" />

                {/* Main content */}
                <main className="relative z-10">
                    {children}
                </main>
            </body>
        </html>
    );
}
