
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DocumentSession, ChatMessage, Profile } from '../types';
import { getChatResponseStreamWithContext, getSmartSuggestions } from '../services/geminiService';
import { BotIcon, UserIcon, SendIcon } from './icons';
import SmartSuggestions from './SmartSuggestions';

// Re-usable components from ChatView
const Message: React.FC<{ message: ChatMessage }> = React.memo(({ message }) => {
  const isModel = message.role === 'model';
  return (
    <div className={`flex items-start gap-3 md:gap-4 ${!isModel && 'flex-row-reverse'}`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isModel ? 'bg-cyan-500' : 'bg-slate-600'}`}>
        {isModel ? <BotIcon className="w-5 h-5 text-white" /> : <UserIcon className="w-5 h-5 text-white" />}
      </div>
      <div className={`p-4 rounded-xl max-w-2xl prose prose-invert prose-p:text-slate-200 prose-p:my-0 prose-pre:font-mono prose-pre:bg-slate-800/50 prose-pre:p-3 prose-pre:rounded-md ${isModel ? 'bg-slate-700' : 'bg-purple-800'}`}>
        <pre className="whitespace-pre-wrap font-sans text-slate-200">{message.content}</pre>
      </div>
    </div>
  );
});

const InputBar: React.FC<{ onSend: (text: string) => void; isLoading: boolean }> = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSend = () => { if (input.trim() && !isLoading) { onSend(input); setInput(''); } };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };

  return (
    <div className="flex items-end gap-2 p-2 bg-slate-700/50 rounded-lg border border-slate-700 focus-within:border-purple-500 transition-colors">
      <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask a question about the document..." rows={1} className="flex-grow bg-transparent p-2 text-slate-200 resize-none focus:outline-none placeholder-slate-400 max-h-48" disabled={isLoading} />
      <button onClick={handleSend} disabled={isLoading || !input.trim()} className="p-3 rounded-lg bg-purple-600 text-white disabled:bg-slate-600 hover:bg-purple-700 transition-colors self-end" aria-label="Send message">
        {isLoading ? <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <SendIcon className="w-5 h-5" />}
      </button>
    </div>
  );
};

interface DocumentAnalyzerProps {
  session: DocumentSession;
  profile: Profile;
  onSendMessage: (sessionId: string, message: ChatMessage) => void;
  onUpdateMessage: (sessionId: string, role: 'model', content: string) => void;
  onAddSuggestions: (sessionId: string, suggestions: string[]) => void;
}

const DocumentAnalyzer: React.FC<DocumentAnalyzerProps> = ({ session, profile, onSendMessage, onUpdateMessage, onAddSuggestions }) => {
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
  useEffect(() => { scrollToBottom(); }, [session?.messages]);

  const handleSend = useCallback(async (text: string) => {
    setIsLoading(true);
    const userMessage: ChatMessage = { role: 'user', content: text };
    onSendMessage(session.id, userMessage);
    
    const modelPlaceholder: ChatMessage = { role: 'model', content: '' };
    onSendMessage(session.id, modelPlaceholder);

    const fullHistory = [...session.messages, userMessage];

    try {
      const stream = await getChatResponseStreamWithContext(session.documentContent, "You are a helpful assistant that answers questions based on the provided document.", fullHistory, text);
      
      let currentResponse = '';
      for await (const chunk of stream) {
        currentResponse += chunk.text;
        onUpdateMessage(session.id, 'model', currentResponse);
      }

      const finalHistory = [...fullHistory, { role: 'model', content: currentResponse }];
      const suggestions = await getSmartSuggestions(finalHistory);
      if (suggestions.length > 0) {
        onAddSuggestions(session.id, suggestions);
      }

    } catch (error) {
      console.error("Error in document chat flow:", error);
      onUpdateMessage(session.id, 'model', 'Sorry, I encountered an error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [session, profile, onSendMessage, onUpdateMessage, onAddSuggestions]);

  const lastMessage = session.messages[session.messages.length - 1];

  return (
    <div className="bg-slate-800 rounded-lg flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white truncate">{session.name}</h2>
        <p className="text-sm text-slate-400">Document Analysis</p>
      </div>
      <div className="flex-grow p-4 overflow-y-auto space-y-6">
        <div className="bg-slate-900/50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg text-slate-200 mb-2">Summary & Key Points</h3>
            <div className="prose prose-sm prose-invert max-w-none prose-p:text-slate-300 prose-ul:text-slate-300">
                <pre className="whitespace-pre-wrap font-sans">{session.summary}</pre>
            </div>
        </div>
        
        {session.messages.map((msg, index) => <Message key={index} message={msg} />)}
        
        {lastMessage?.role === 'model' && lastMessage.suggestions && (
          <SmartSuggestions suggestions={lastMessage.suggestions} onSuggestionClick={(suggestion) => handleSend(suggestion)} />
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t border-slate-700">
        <InputBar onSend={handleSend} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default DocumentAnalyzer;
