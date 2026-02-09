'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Image, Video, X, File } from 'lucide-react';

interface FileUploadProps {
    onFilesDropped: (files: File[]) => void;
    files: File[];
    onRemoveFile: (index: number) => void;
}

export default function FileUpload({ onFilesDropped, files, onRemoveFile }: FileUploadProps) {
    const [isDragOver, setIsDragOver] = useState(false);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        onFilesDropped(acceptedFiles);
        setIsDragOver(false);
    }, [onFilesDropped]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        onDragEnter: () => setIsDragOver(true),
        onDragLeave: () => setIsDragOver(false),
        accept: {
            'application/pdf': ['.pdf'],
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov'],
            'text/*': ['.txt', '.csv', '.fasta', '.pdb'],
        },
        maxSize: 50 * 1024 * 1024, // 50MB
    });

    const getFileIcon = (file: File) => {
        if (file.type.startsWith('image/')) return <Image className="w-5 h-5 text-neon-green" />;
        if (file.type.startsWith('video/')) return <Video className="w-5 h-5 text-neon-orange" />;
        if (file.type === 'application/pdf') return <FileText className="w-5 h-5 text-neon-magenta" />;
        return <File className="w-5 h-5 text-neon-cyan" />;
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="card space-y-4">
            <label className="text-sm font-medium text-gray-300">
                Research Data
            </label>

            {/* Drop Zone */}
            <div
                {...getRootProps()}
                className={`upload-zone rounded-xl p-8 text-center cursor-pointer transition-all ${isDragOver ? 'drag-over' : ''
                    }`}
            >
                <input {...getInputProps()} />

                <motion.div
                    animate={isDragOver ? { scale: 1.05 } : { scale: 1 }}
                    className="flex flex-col items-center gap-3"
                >
                    <div className={`p-4 rounded-full ${isDragOver ? 'bg-neon-cyan/20' : 'bg-dark-700'} transition-colors`}>
                        <Upload className={`w-8 h-8 ${isDragOver ? 'text-neon-cyan' : 'text-gray-400'} transition-colors`} />
                    </div>

                    <div>
                        <p className="text-white font-medium">
                            {isDragActive ? 'Drop files here...' : 'Drag & drop research files'}
                        </p>
                        <p className="text-gray-500 text-sm mt-1">
                            or click to browse
                        </p>
                    </div>

                    <div className="flex flex-wrap justify-center gap-2 mt-2">
                        {[
                            { label: 'PDF', color: 'text-neon-magenta' },
                            { label: 'Images', color: 'text-neon-green' },
                            { label: 'Video', color: 'text-neon-orange' },
                            { label: 'FASTA', color: 'text-neon-cyan' },
                            { label: 'PDB', color: 'text-neon-cyan' },
                        ].map((type) => (
                            <span
                                key={type.label}
                                className={`px-2 py-0.5 rounded text-xs bg-dark-700 ${type.color}`}
                            >
                                {type.label}
                            </span>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* File List */}
            <AnimatePresence>
                {files.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        {files.map((file, index) => (
                            <motion.div
                                key={`${file.name}-${index}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex items-center gap-3 p-3 rounded-lg bg-dark-700 border border-dark-600 group"
                            >
                                {getFileIcon(file)}

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemoveFile(index);
                                    }}
                                    className="p-1 rounded hover:bg-dark-600 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
