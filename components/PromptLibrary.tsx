
import React, { useState, useMemo } from 'react';
import { Prompt, PromptCategory } from '../types';
import PromptCard from './PromptCard';
import { SearchIcon, SparklesIcon, CodeBracketIcon, BookIcon, ChatBubbleIcon } from './icons';

interface PromptLibraryProps {
  prompts: Prompt[];
  onSelect: (id: string) => void;
  onTest: (prompt: Prompt) => void;
}

const CATEGORIES: { label: PromptCategory; icon: React.FC<{className?: string}> }[] = [
  { label: 'Coding', icon: CodeBracketIcon },
  { label: 'System', icon: ChatBubbleIcon },
  { label: 'Creative', icon: SparklesIcon },
  { label: 'Productivity', icon: BookIcon },
  { label: 'Education', icon: BookIcon },
];

const PromptLibrary: React.FC<PromptLibraryProps> = ({ prompts, onSelect, onTest }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<PromptCategory | 'All'>('All');

  const filteredPrompts = useMemo(() => {
    return prompts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [prompts, searchQuery, activeCategory]);

  return (
    <div className="flex flex-col h-full overflow-hidden animate-fade-in">
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold text-white mb-2 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Discover Agents & Rules
        </h2>
        <p className="text-slate-400 max-w-2xl">
          Browse our curated collection of high-performance system prompts and coding agent rules. Instantly deploy them into your workflow or test them in real-time.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-grow">
          <input
            type="text"
            placeholder="Search personas, coding rules, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl py-3 pl-11 pr-4 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all backdrop-blur-sm"
          />
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
        </div>
        <div className="flex bg-slate-800/50 p-1 rounded-xl border border-slate-700/50 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveCategory('All')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeCategory === 'All' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
          >
            All
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.label}
              onClick={() => setActiveCategory(cat.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeCategory === cat.label ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <cat.icon className="w-4 h-4" />
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredPrompts.map(prompt => (
            <PromptCard 
              key={prompt.id} 
              prompt={prompt} 
              onSelect={onSelect} 
              onTest={onTest} 
            />
          ))}
          {filteredPrompts.length === 0 && (
            <div className="col-span-full py-20 text-center bg-slate-800/20 rounded-3xl border border-dashed border-slate-700/50">
              <SearchIcon className="mx-auto w-12 h-12 text-slate-600 mb-4" />
              <h3 className="text-xl font-bold text-slate-400">No prompts found</h3>
              <p className="text-slate-500">Try adjusting your search or category filters.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptLibrary;
