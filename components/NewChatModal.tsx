
import React, { useState, useMemo } from 'react';
import { Prompt } from '../types';
import { CloseIcon, SearchIcon, SparklesIcon } from './icons';
import Tag from './Tag';

interface NewChatModalProps {
  prompts: Prompt[];
  onClose: () => void;
  onSelect: (promptId: string) => void;
  onTestPrompt: (prompt: Prompt) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ prompts, onClose, onSelect, onTestPrompt }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPrompts = useMemo(() => {
    if (!searchQuery.trim()) return prompts;
    const lowercasedQuery = searchQuery.toLowerCase();
    return prompts.filter(p =>
      p.title.toLowerCase().includes(lowercasedQuery) ||
      p.description.toLowerCase().includes(lowercasedQuery) ||
      p.tags.some(tag => tag.toLowerCase().includes(lowercasedQuery))
    );
  }, [prompts, searchQuery]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100">Start a New Chat</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors"><CloseIcon /></button>
        </div>
        <div className="p-4 border-b border-slate-700">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for a persona by title, description, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-md pl-10 pr-4 py-2 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><SearchIcon className="text-slate-400" /></div>
          </div>
        </div>
        <div className="p-4 overflow-y-auto space-y-3">
          {filteredPrompts.map(prompt => (
            <div key={prompt.id} className="p-4 rounded-lg bg-slate-900/70 border border-slate-700/50">
              <h3 className="font-bold text-white">{prompt.title}</h3>
              <p className="text-sm text-slate-400 mt-1">{prompt.description}</p>
              <div className="mt-3">{prompt.tags.map(tag => <Tag key={tag} label={tag} />)}</div>
              <div className="mt-4 flex gap-3">
                <button onClick={() => onSelect(prompt.id)} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                  Start Chat
                </button>
                <button onClick={() => onTestPrompt(prompt)} className="flex-1 bg-slate-600 hover:bg-slate-500 text-white font-semibold py-2 px-4 rounded-md transition-colors">
                  Test
                </button>
              </div>
            </div>
          ))}
           {filteredPrompts.length === 0 && (
            <div className="text-center py-10">
              <p className="text-slate-400 font-semibold">No personas found.</p>
              <p className="text-slate-500 text-sm mt-1">Try a different search query or add a new persona.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
