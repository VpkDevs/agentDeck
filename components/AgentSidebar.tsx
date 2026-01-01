
import React, { useState } from 'react';
import { Prompt } from '../types';
import { SearchIcon, CodeBracketIcon, SparklesIcon, ChatBubbleIcon, BookIcon, PlusIcon } from './icons';

interface AgentSidebarProps {
  prompts: Prompt[];
  onSelect: (prompt: Prompt) => void;
  activePromptId: string | null;
  onAddAgent: () => void;
}

const CategoryIcon = ({ category }: { category: string }) => {
    switch (category) {
      case 'Coding': return <CodeBracketIcon className="w-4 h-4 text-blue-400" />;
      case 'Creative': return <SparklesIcon className="w-4 h-4 text-purple-400" />;
      case 'System': return <ChatBubbleIcon className="w-4 h-4 text-green-400" />;
      default: return <BookIcon className="w-4 h-4 text-slate-400" />;
    }
  };

const AgentSidebar: React.FC<AgentSidebarProps> = ({ prompts, onSelect, activePromptId, onAddAgent }) => {
  const [query, setQuery] = useState('');

  const filtered = prompts.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    p.tags.some(t => t.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-slate-900 border-r border-slate-800">
        <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Agent Library</h2>
            <div className="relative mb-3">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input 
                    type="text" 
                    value={query} 
                    onChange={e => setQuery(e.target.value)} 
                    placeholder="Search agents..." 
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-sm text-slate-300 focus:outline-none focus:border-purple-500 transition-colors"
                />
            </div>
            <button 
                onClick={onAddAgent}
                className="w-full flex items-center justify-center gap-2 py-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg text-white text-xs font-bold hover:opacity-90 transition-opacity"
            >
                <PlusIcon className="w-4 h-4" />
                Create New Agent
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            <div 
                onClick={() => onSelect(null as any)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${!activePromptId ? 'bg-slate-800 border border-purple-500/50' : 'hover:bg-slate-800/50 border border-transparent'}`}
            >
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <ChatBubbleIcon className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-200">Raw Chat</h3>
                        <p className="text-[10px] text-slate-500">Default Model</p>
                    </div>
                </div>
            </div>
            
            <div className="my-2 border-t border-slate-800 mx-2" />

            {filtered.map(prompt => (
                <div 
                    key={prompt.id}
                    onClick={() => onSelect(prompt)}
                    className={`p-3 rounded-xl cursor-pointer transition-all border ${activePromptId === prompt.id ? 'bg-slate-800 border-purple-500/50 shadow-lg shadow-purple-900/10' : 'hover:bg-slate-800/50 border-transparent'}`}
                >
                    <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                             <CategoryIcon category={prompt.category} />
                             <span className="text-[10px] text-slate-500 font-mono uppercase">{prompt.category}</span>
                        </div>
                    </div>
                    <h3 className="text-sm font-bold text-slate-200 truncate">{prompt.title}</h3>
                    <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">{prompt.description}</p>
                </div>
            ))}
        </div>
    </div>
  );
};

export default AgentSidebar;
