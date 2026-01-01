
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ChatSession, ChatMessage, Prompt, Profile } from '../types';
import { getChatResponseStream, getSmartSuggestions, transcribeAudio, generateSpeech } from '../services/geminiService';
import { BotIcon, UserIcon, SendIcon, SparklesIcon, GlobeIcon, BrainIcon, MapIcon, MicIcon, SpeakerIcon } from './icons';
import SmartSuggestions from './SmartSuggestions';

const Message: React.FC<{ message: ChatMessage }> = React.memo(({ message }) => {
  const isModel = message.role === 'model';
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayTTS = async () => {
      if (isPlaying) return;
      setIsPlaying(true);
      try {
          const audioBuffer = await generateSpeech(message.content);
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const buffer = await ctx.decodeAudioData(audioBuffer);
          const source = ctx.createBufferSource();
          source.buffer = buffer;
          source.connect(ctx.destination);
          source.start(0);
          source.onended = () => setIsPlaying(false);
      } catch (e) {
          console.error("TTS failed", e);
          setIsPlaying(false);
      }
  };

  return (
    <div className={`flex items-start gap-3 md:gap-4 ${!isModel && 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-cyan-500' : 'bg-slate-600'}`}>
        {isModel ? <BotIcon className="w-5 h-5 text-white" /> : <UserIcon className="w-5 h-5 text-white" />}
      </div>
      <div className={`flex flex-col max-w-2xl ${!isModel && 'items-end'}`}>
        <div className={`relative group p-4 rounded-xl prose prose-invert prose-p:text-slate-200 prose-p:my-0 prose-pre:font-mono prose-pre:bg-slate-800/50 prose-pre:p-3 prose-pre:rounded-md ${isModel ? 'bg-slate-700' : 'bg-purple-800'}`}>
            <pre className="whitespace-pre-wrap font-sans text-slate-200">{message.content}</pre>
            
            {isModel && message.content && (
                <button 
                    onClick={handlePlayTTS}
                    disabled={isPlaying}
                    className={`absolute -bottom-3 -right-3 p-1.5 rounded-full shadow-md transition-colors ${isPlaying ? 'bg-cyan-600 text-white' : 'bg-slate-600 text-slate-300 hover:bg-cyan-600 hover:text-white'} opacity-0 group-hover:opacity-100`}
                    title="Read Aloud"
                >
                    <SpeakerIcon className="w-4 h-4" />
                </button>
            )}
        </div>
        
        {message.sources && message.sources.length > 0 && (
            <div className="mt-2 bg-slate-800/50 p-2 rounded-lg text-xs w-full">
                <p className="text-slate-400 font-semibold mb-1 flex items-center gap-1">
                    <GlobeIcon className="w-3 h-3" /> Sources / Grounding
                </p>
                <div className="flex flex-wrap gap-2">
                    {message.sources.map((source, idx) => (
                        <a 
                            key={idx} 
                            href={source.uri} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-cyan-400 hover:text-cyan-300 hover:underline truncate max-w-[200px] flex items-center gap-1"
                            title={source.title}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 inline-block"></span>
                            {source.title || source.uri}
                        </a>
                    ))}
                </div>
            </div>
        )}
      </div>
    </div>
  );
});

const InputBar: React.FC<{ 
    onSend: (text: string) => void; 
    isLoading: boolean;
    useSearch: boolean;
    setUseSearch: (val: boolean) => void;
    useThinking: boolean;
    setUseThinking: (val: boolean) => void;
    useMaps: boolean;
    setUseMaps: (val: boolean) => void;
}> = ({ onSend, isLoading, useSearch, setUseSearch, useThinking, setUseThinking, useMaps, setUseMaps }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startRecording = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const recorder = new MediaRecorder(stream);
          const chunks: BlobPart[] = [];
          
          recorder.ondataavailable = (e) => chunks.push(e.data);
          recorder.onstop = async () => {
              const blob = new Blob(chunks, { type: 'audio/webm' }); // Chrome records weba/webm usually
              const reader = new FileReader();
              reader.readAsDataURL(blob);
              reader.onloadend = async () => {
                  const base64data = (reader.result as string).split(',')[1];
                  const text = await transcribeAudio(base64data, 'audio/webm');
                  setInput(prev => prev + (prev ? ' ' : '') + text);
              };
              stream.getTracks().forEach(track => track.stop());
          };
          
          recorder.start();
          mediaRecorderRef.current = recorder;
          setIsRecording(true);
      } catch (err) {
          console.error("Mic access denied", err);
      }
  };

  const stopRecording = () => {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
  };

  return (
    <div className="flex flex-col gap-2">
        <div className="flex gap-2 px-1 flex-wrap">
            <button 
                onClick={() => setUseSearch(!useSearch)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${useSearch ? 'bg-cyan-600/20 text-cyan-300 border border-cyan-500/50' : 'bg-slate-700/50 text-slate-400 border border-transparent hover:bg-slate-700'}`}
                title="Enable Google Search Grounding"
            >
                <GlobeIcon className="w-3.5 h-3.5" />
                Search {useSearch && 'On'}
            </button>
            <button 
                onClick={() => setUseMaps(!useMaps)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${useMaps ? 'bg-green-600/20 text-green-300 border border-green-500/50' : 'bg-slate-700/50 text-slate-400 border border-transparent hover:bg-slate-700'}`}
                title="Enable Google Maps Grounding"
            >
                <MapIcon className="w-3.5 h-3.5" />
                Maps {useMaps && 'On'}
            </button>
            <button 
                onClick={() => setUseThinking(!useThinking)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${useThinking ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50' : 'bg-slate-700/50 text-slate-400 border border-transparent hover:bg-slate-700'}`}
                title="Enable Deep Thinking Mode (Gemini 3 Pro)"
            >
                <BrainIcon className="w-3.5 h-3.5" />
                Deep Think {useThinking && 'On'}
            </button>
        </div>
        <div className="flex items-end gap-2 p-2 bg-slate-700/50 rounded-lg border border-slate-700 focus-within:border-purple-500 transition-colors">
        <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-3 rounded-lg transition-colors ${isRecording ? 'bg-red-500 hover:bg-red-600 animate-pulse text-white' : 'text-slate-400 hover:bg-slate-600 hover:text-white'}`}
            title="Transcribe Audio"
        >
            <MicIcon className="w-5 h-5" />
        </button>
        <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={isRecording ? "Listening..." : "Type your message..."}
            rows={1}
            className="flex-grow bg-transparent p-2 text-slate-200 resize-none focus:outline-none placeholder-slate-400 max-h-48"
            disabled={isLoading}
        />
        <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="p-3 rounded-lg bg-purple-600 text-white disabled:bg-slate-600 hover:bg-purple-700 transition-colors self-end"
            aria-label="Send message"
        >
            {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            ) : (
            <SendIcon className="w-5 h-5" />
            )}
        </button>
        </div>
    </div>
  );
};

interface ChatViewProps {
  session: ChatSession | null;
  prompt: Prompt | null;
  profile: Profile;
  onSendMessage: (sessionId: string, message: ChatMessage) => void;
  onUpdateMessage: (sessionId: string, role: 'model', content: string, sources?: { title: string; uri: string }[]) => void;
  onAddSuggestions: (sessionId: string, suggestions: string[]) => void;
}

const ChatView: React.FC<ChatViewProps> = ({ session, prompt, profile, onSendMessage, onUpdateMessage, onAddSuggestions }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [useMaps, setUseMaps] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session?.messages]);

  const handleSend = useCallback(async (text: string) => {
    if (!session || !prompt) return;

    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: text };
    onSendMessage(session.id, userMessage);
    
    const modelPlaceholder: ChatMessage = { role: 'model', content: '' };
    onSendMessage(session.id, modelPlaceholder);

    const fullHistory = [...session.messages, userMessage];

    try {
      let location: { lat: number, lng: number } | undefined;
      
      if (useMaps) {
          try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                  navigator.geolocation.getCurrentPosition(resolve, reject);
              });
              location = {
                  lat: pos.coords.latitude,
                  lng: pos.coords.longitude
              };
          } catch (e) {
              console.warn("Could not get location", e);
              // Fallback without location if permission denied
          }
      }

      const stream = await getChatResponseStream(prompt, profile, fullHistory, text, { useSearch, useThinking, useMaps, location });
      
      let currentResponse = '';
      let accumulatedSources: { title: string; uri: string }[] = [];

      for await (const chunk of stream) {
        currentResponse += chunk.text;
        
        // Extract grounding metadata if present
        const metadata = (chunk as any).candidates?.[0]?.groundingMetadata;
        if (metadata?.groundingChunks) {
            const chunks = metadata.groundingChunks;
            for (const c of chunks) {
                if (c.web?.uri && c.web?.title) {
                    if (!accumulatedSources.some(s => s.uri === c.web.uri)) {
                        accumulatedSources.push({ title: c.web.title, uri: c.web.uri });
                    }
                }
            }
        }
        
        onUpdateMessage(session.id, 'model', currentResponse, accumulatedSources.length > 0 ? accumulatedSources : undefined);
      }

      const finalHistory = [...fullHistory, { role: 'model', content: currentResponse }];
      const suggestions = await getSmartSuggestions(finalHistory);
      if (suggestions.length > 0) {
        onAddSuggestions(session.id, suggestions);
      }

    } catch (error) {
      console.error("Error in chat flow:", error);
      onUpdateMessage(session.id, 'model', 'Sorry, I encountered an error. Please check the console or try again.');
    } finally {
      setIsLoading(false);
    }
  }, [session, prompt, profile, onSendMessage, onUpdateMessage, onAddSuggestions, useSearch, useThinking, useMaps]);

  if (!session || !prompt) {
    return null; 
  }

  const lastMessage = session.messages[session.messages.length - 1];

  return (
    <div className="bg-slate-800 rounded-lg flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
            {prompt.title}
            {useThinking && <span className="bg-purple-900 text-purple-200 text-xs px-2 py-0.5 rounded-full border border-purple-500/30">Pro Mode</span>}
        </h2>
        <p className="text-sm text-slate-400">by {prompt.author}</p>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        {session.messages.map((msg, index) => (
          <Message key={index} message={msg} />
        ))}
        {lastMessage?.role === 'model' && lastMessage.suggestions && (
          <SmartSuggestions
            suggestions={lastMessage.suggestions}
            onSuggestionClick={(suggestion) => handleSend(suggestion)}
          />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-700">
        <InputBar 
            onSend={handleSend} 
            isLoading={isLoading} 
            useSearch={useSearch} 
            setUseSearch={setUseSearch} 
            useThinking={useThinking}
            setUseThinking={setUseThinking}
            useMaps={useMaps}
            setUseMaps={setUseMaps}
        />
      </div>
    </div>
  );
};

export default ChatView;
