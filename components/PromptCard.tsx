
import React, { useState } from 'react';
import { Prompt } from '../types';
import { CopyIcon, CheckIcon, ChatBubbleIcon, SparklesIcon, HeartIcon, CodeBracketIcon, BookIcon } from './icons';
import Tag from './Tag';

interface PromptCardProps {
  prompt: Prompt;
  onSelect: (id: string) => void;
  onTest: (prompt: Prompt) => void;
}

const PromptCard: React.FC<PromptCardProps> = ({ prompt, onSelect, onTest }) => {
  const [copied, setCopied] = useState(false);
  const [liked, setLiked] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(prompt.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked(!liked);
  };

  const CategoryIcon = () => {
    switch (prompt.category) {
      case 'Coding': return <CodeBracketIcon className="w-4 h-4 text-blue-400" />;
      case 'Creative': return <SparklesIcon className="w-4 h-4 text-purple-400" />;
      case 'System': return <ChatBubbleIcon className="w-4 h-4 text-green-400" />;
      default: return <BookIcon className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="group relative bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-5 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2 bg-slate-900/50 px-2 py-1 rounded-full border border-slate-700/50">
          <CategoryIcon />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">{prompt.category}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleLike}
            className={`p-1.5 rounded-lg transition-colors ${liked ? 'text-red-500 bg-red-500/10' : 'text-slate-500 hover:text-red-400 hover:bg-slate-700/50'}`}
          >
            <HeartIcon className="w-5 h-5" fill={liked ? 'currentColor' : 'none'} />
          </button>
          <button 
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-400 hover:bg-slate-700/50 transition-colors"
            title="Copy Prompt"
          >
            {copied ? <CheckIcon className="w-5 h-5 text-green-500" /> : <CopyIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 group-hover:text-purple-400 transition-colors truncate">
        {prompt.title}
      </h3>
      
      <p className="text-sm text-slate-400 line-clamp-3 flex-grow mb-4 leading-relaxed">
        {prompt.description}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-5">
        {prompt.tags.slice(0, 3).map(tag => (
          <Tag key={tag} label={tag} />
        ))}
        {prompt.tags.length > 3 && <span className="text-[10px] text-slate-500 self-center">+{prompt.tags.length - 3}</span>}
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500">Author</span>
          <span className="text-xs font-semibold text-slate-300">@{prompt.author}</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => onTest(prompt)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white bg-slate-700/50 hover:bg-slate-700 transition-colors"
          >
            Test
          </button>
          <button 
            onClick={() => onSelect(prompt.id)}
            className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 transition-all shadow-lg shadow-purple-900/20"
          >
            Use Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptCard;
