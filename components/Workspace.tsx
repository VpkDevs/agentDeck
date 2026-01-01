
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Session, ChatMessage, Prompt, Profile, Attachment } from '../types';
import { streamGeminiResponse, getSmartSuggestions, generateSpeech } from '../services/geminiService';
import InputBar from './InputBar';
import { BotIcon, UserIcon, SpeakerIcon, GlobeIcon, BrainIcon } from './icons';
import ReactMarkdown from 'react-markdown';

interface WorkspaceProps {
    session: Session;
    prompt: Prompt | null;
    profile: Profile;
    onUpdateSession: (session: Session) => void;
}

const MessageItem: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isModel = message.role === 'model';
    
    return (
        <div className={`flex gap-4 ${isModel ? 'flex-row' : 'flex-row-reverse'}`}>
            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-gradient-to-br from-purple-500 to-blue-500' : 'bg-slate-600'}`}>
                {isModel ? <BotIcon className="w-5 h-5 text-white" /> : <UserIcon className="w-5 h-5 text-white" />}
            </div>
            
            <div className={`flex flex-col max-w-[85%] ${isModel ? 'items-start' : 'items-end'}`}>
                 {/* Attachments Display */}
                 {message.attachments && message.attachments.length > 0 && (
                     <div className="flex gap-2 mb-2">
                        {message.attachments.map((att, i) => (
                             att.type === 'image' ? (
                                <img key={i} src={`data:${att.mimeType};base64,${att.content}`} className="max-h-48 rounded-lg border border-slate-700" alt="attachment" />
                             ) : (
                                <div key={i} className="bg-slate-800 p-2 rounded border border-slate-700 text-xs font-mono text-slate-300">
                                    File: {att.name}
                                </div>
                             )
                        ))}
                     </div>
                 )}

                <div className={`relative px-5 py-3.5 rounded-2xl ${isModel ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-purple-600 text-white rounded-tr-none'}`}>
                    <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-white/10">
                        {message.content ? <ReactMarkdown>{message.content}</ReactMarkdown> : <span className="animate-pulse">Thinking...</span>}
                    </div>
                </div>

                {/* Sources */}
                {message.sources && message.sources.length > 0 && (
                     <div className="mt-2 flex flex-wrap gap-2">
                        {message.sources.map((src, i) => (
                            <a key={i} href={src.uri} target="_blank" className="flex items-center gap-1 bg-slate-800/50 hover:bg-slate-800 px-2 py-1 rounded text-[10px] text-cyan-400 transition-colors border border-slate-700">
                                <GlobeIcon className="w-3 h-3" />
                                {src.title || new URL(src.uri).hostname}
                            </a>
                        ))}
                     </div>
                )}
            </div>
        </div>
    );
};

const Workspace: React.FC<WorkspaceProps> = ({ session, prompt, profile, onUpdateSession }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [useSearch, setUseSearch] = useState(false);
    const [useThinking, setUseThinking] = useState(false);
    const [useMaps, setUseMaps] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [session.messages]);

    const handleSend = useCallback(async (text: string, attachments: Attachment[]) => {
        setIsLoading(true);
        
        // 1. Add User Message
        const newUserMsg: ChatMessage = { role: 'user', content: text, attachments };
        const updatedMessages = [...session.messages, newUserMsg];
        const newSessionState = { ...session, messages: updatedMessages, updatedAt: Date.now() };
        onUpdateSession(newSessionState);

        // 2. Add Placeholder Model Message
        const placeholderMsg: ChatMessage = { role: 'model', content: '' };
        onUpdateSession({ ...newSessionState, messages: [...updatedMessages, placeholderMsg] });

        try {
            let location;
            if (useMaps) {
                 // Simple mock or real browser location
                 try {
                    const pos = await new Promise<GeolocationPosition>((res, rej) => navigator.geolocation.getCurrentPosition(res, rej));
                    location = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                 } catch (e) {}
            }

            const stream = await streamGeminiResponse(updatedMessages, text, attachments, prompt, profile, { useSearch, useThinking, useMaps, location });
            
            let fullText = '';
            let sources: any[] = [];

            for await (const chunk of stream) {
                fullText += chunk.text;
                const meta = (chunk as any).candidates?.[0]?.groundingMetadata;
                if (meta?.groundingChunks) {
                     meta.groundingChunks.forEach((c: any) => {
                         if (c.web?.uri && !sources.some(s => s.uri === c.web.uri)) sources.push(c.web);
                     });
                }
                
                // Real-time update
                onUpdateSession({
                    ...session,
                    messages: [...updatedMessages, { role: 'model', content: fullText, sources }],
                    updatedAt: Date.now()
                });
            }
            
            // Post-generation suggestions
            const historyForSuggestions = [...updatedMessages, { role: 'model', content: fullText }];
            const suggestions = await getSmartSuggestions(historyForSuggestions);
            
            onUpdateSession({
                ...session,
                messages: [...updatedMessages, { role: 'model', content: fullText, sources, suggestions }],
                updatedAt: Date.now()
            });

        } catch (e) {
            console.error(e);
            onUpdateSession({
                ...session,
                messages: [...updatedMessages, { role: 'model', content: "Error: Could not generate response." }],
                updatedAt: Date.now()
            });
        } finally {
            setIsLoading(false);
        }
    }, [session, prompt, profile, useSearch, useThinking, useMaps]);

    // Empty State
    if (session.messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col h-full relative">
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                    <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-purple-900/20 rotate-3">
                        {prompt ? <BotIcon className="w-10 h-10 text-purple-400" /> : <BrainIcon className="w-10 h-10 text-slate-400" />}
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">
                        {prompt ? prompt.title : 'AgentDeck Workspace'}
                    </h1>
                    <p className="text-slate-400 max-w-md mb-8 leading-relaxed">
                        {prompt ? prompt.description : 'Select an agent from the library or start typing to chat with the default model.'}
                    </p>
                    
                    {/* Active Agent Badge */}
                    {prompt && (
                        <div className="bg-slate-800/50 border border-slate-700 px-4 py-2 rounded-full text-xs font-mono text-purple-300 mb-8">
                            SYSTEM: ACTIVE
                        </div>
                    )}
                </div>
                <div className="p-6 max-w-3xl mx-auto w-full">
                    <InputBar 
                        onSend={handleSend} 
                        isLoading={isLoading}
                        useSearch={useSearch} setUseSearch={setUseSearch}
                        useThinking={useThinking} setUseThinking={setUseThinking}
                        useMaps={useMaps} setUseMaps={setUseMaps}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full relative">
             {/* Header */}
            <div className="absolute top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-10 flex items-center justify-between px-6">
                <div>
                    <h2 className="font-bold text-white">{session.name}</h2>
                    <p className="text-xs text-slate-500">{prompt ? `Agent: ${prompt.title}` : 'Raw Chat'}</p>
                </div>
                {/* Actions could go here */}
            </div>

            {/* Scrollable Chat */}
            <div className="flex-1 overflow-y-auto pt-20 px-4 pb-4 space-y-6 custom-scrollbar">
                <div className="max-w-3xl mx-auto space-y-6">
                    {session.messages.map((msg, i) => (
                        <MessageItem key={i} message={msg} />
                    ))}
                    {session.messages[session.messages.length - 1].suggestions && (
                        <div className="flex flex-wrap gap-2 justify-end">
                            {session.messages[session.messages.length - 1].suggestions?.map((s, i) => (
                                <button key={i} onClick={() => handleSend(s, [])} className="text-xs bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-400 px-3 py-1.5 rounded-full transition-colors border border-slate-700">
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
            </div>

            {/* Input Area */}
            <div className="p-6 bg-gradient-to-t from-slate-900 via-slate-900 to-transparent">
                <div className="max-w-3xl mx-auto">
                     <InputBar 
                        onSend={handleSend} 
                        isLoading={isLoading}
                        useSearch={useSearch} setUseSearch={setUseSearch}
                        useThinking={useThinking} setUseThinking={setUseThinking}
                        useMaps={useMaps} setUseMaps={setUseMaps}
                    />
                </div>
            </div>
        </div>
    );
};

export default Workspace;
