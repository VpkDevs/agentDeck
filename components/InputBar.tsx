
import React, { useState, useRef, useEffect } from 'react';
import { Attachment } from '../types';
import { SendIcon, MicIcon, PaperClipIcon, GlobeIcon, MapIcon, BrainIcon, CloseIcon } from './icons';
import { transcribeAudio } from '../services/geminiService';
import { readTextFile, readImageAsBase64 } from '../utils/file';

interface InputBarProps {
    onSend: (text: string, attachments: Attachment[]) => void;
    isLoading: boolean;
    useSearch: boolean;
    setUseSearch: (val: boolean) => void;
    useThinking: boolean;
    setUseThinking: (val: boolean) => void;
    useMaps: boolean;
    setUseMaps: (val: boolean) => void;
}

const InputBar: React.FC<InputBarProps> = ({ onSend, isLoading, useSearch, setUseSearch, useThinking, setUseThinking, useMaps, setUseMaps }) => {
    const [input, setInput] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
        }
    }, [input]);

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            try {
                if (file.type.startsWith('image/')) {
                    const { base64, mimeType } = await readImageAsBase64(file);
                    setAttachments(prev => [...prev, { type: 'image', content: base64, mimeType, name: file.name }]);
                } else if (file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.json') || file.name.endsWith('.ts') || file.name.endsWith('.tsx') || file.name.endsWith('.js')) {
                    const text = await readTextFile(file);
                    setAttachments(prev => [...prev, { type: 'text', content: text, mimeType: 'text/plain', name: file.name }]);
                } else {
                    alert("Unsupported file type. Please upload images or text files.");
                }
            } catch (err) {
                console.error(err);
            }
        }
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        if ((input.trim() || attachments.length > 0) && !isLoading) {
            onSend(input, attachments);
            setInput('');
            setAttachments([]);
            if (textareaRef.current) textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex flex-col gap-3">
             {/* Attachment Previews */}
            {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                    {attachments.map((att, i) => (
                        <div key={i} className="relative group flex-shrink-0 bg-slate-800 border border-slate-700 rounded-lg p-2 w-24 h-24 flex flex-col items-center justify-center overflow-hidden">
                            <button onClick={() => removeAttachment(i)} className="absolute top-1 right-1 bg-red-500 rounded-full p-0.5 text-white opacity-0 group-hover:opacity-100 transition-opacity"><CloseIcon className="w-3 h-3" /></button>
                            {att.type === 'image' ? (
                                <img src={`data:${att.mimeType};base64,${att.content}`} alt="preview" className="w-full h-full object-cover rounded" />
                            ) : (
                                <div className="text-[10px] text-slate-400 font-mono break-all p-1 overflow-hidden">{att.name}</div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="relative bg-slate-800/80 backdrop-blur-md rounded-2xl border border-slate-700/50 shadow-xl ring-1 ring-white/5 focus-within:ring-purple-500/50 transition-all">
                <textarea
                    ref={textareaRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask anything..."
                    className="w-full bg-transparent p-4 text-slate-200 resize-none focus:outline-none placeholder-slate-500 min-h-[56px] max-h-48"
                    disabled={isLoading}
                />
                
                <div className="flex items-center justify-between px-2 pb-2">
                    <div className="flex items-center gap-1">
                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*,.txt,.md,.json,.js,.ts,.tsx" />
                        <button onClick={() => fileInputRef.current?.click()} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition-colors" title="Attach File">
                            <PaperClipIcon className="w-5 h-5" />
                        </button>
                        <div className="h-4 w-[1px] bg-slate-700 mx-1"></div>
                        <button onClick={() => setUseSearch(!useSearch)} className={`p-2 rounded-lg transition-colors ${useSearch ? 'text-cyan-400 bg-cyan-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`} title="Web Search">
                            <GlobeIcon className="w-5 h-5" />
                        </button>
                        <button onClick={() => setUseThinking(!useThinking)} className={`p-2 rounded-lg transition-colors ${useThinking ? 'text-purple-400 bg-purple-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`} title="Deep Thinking">
                            <BrainIcon className="w-5 h-5" />
                        </button>
                         <button onClick={() => setUseMaps(!useMaps)} className={`p-2 rounded-lg transition-colors ${useMaps ? 'text-green-400 bg-green-900/20' : 'text-slate-400 hover:text-white hover:bg-slate-700/50'}`} title="Maps">
                            <MapIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <button 
                        onClick={handleSend}
                        disabled={isLoading || (!input.trim() && attachments.length === 0)}
                        className={`p-2 rounded-xl transition-all ${input.trim() || attachments.length > 0 ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-900/20 hover:scale-105' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}
                    >
                        {isLoading ? (
                           <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <SendIcon className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InputBar;
