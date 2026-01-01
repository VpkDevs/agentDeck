
import React from 'react';
import { UserIcon, CodeBracketIcon } from './icons';

interface HeaderProps {
    onAddPrompt: () => void;
    onOpenProfile: () => void;
}

const Header: React.FC<HeaderProps> = ({ onAddPrompt, onOpenProfile }) => {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-2" onClick={() => window.location.reload()}>
            <div className="w-8 h-8 bg-gradient-to-tr from-purple-600 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-900/50">
                <CodeBracketIcon className="text-white w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-white">Agent<span className="text-purple-400">Deck</span></h1>
      </div>

      <div className="flex items-center gap-4">
        <a href="https://ai.google.dev" target="_blank" className="text-xs font-medium text-slate-500 hover:text-purple-400 transition-colors">Powered by Gemini</a>
        <div className="h-4 w-[1px] bg-slate-800"></div>
        <button 
            onClick={onOpenProfile}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <UserIcon className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Header;
