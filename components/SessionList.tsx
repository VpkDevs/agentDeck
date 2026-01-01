
import React from 'react';
import { Session } from '../types';
import { ChatBubbleIcon, TrashIcon } from './icons';

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({ sessions, activeSessionId, onSelect, onDelete }) => {
  return (
    <div className="flex flex-col h-full bg-slate-900 border-l border-slate-800">
        <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider">History</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {sessions.length === 0 && (
                <div className="text-center mt-10 px-4">
                    <p className="text-xs text-slate-600">No chat history yet.</p>
                </div>
            )}
            {sessions.map(session => (
                <div 
                    key={session.id}
                    onClick={() => onSelect(session.id)}
                    className={`group relative p-3 rounded-lg cursor-pointer transition-colors ${activeSessionId === session.id ? 'bg-slate-800' : 'hover:bg-slate-800/50'}`}
                >
                    <div className="flex items-start gap-3">
                        <ChatBubbleIcon className={`w-4 h-4 mt-0.5 ${activeSessionId === session.id ? 'text-purple-400' : 'text-slate-600'}`} />
                        <div className="flex-1 min-w-0">
                            <h4 className={`text-sm font-medium truncate ${activeSessionId === session.id ? 'text-white' : 'text-slate-400'}`}>{session.name}</h4>
                            <p className="text-[10px] text-slate-600 truncate">
                                {new Date(session.updatedAt).toLocaleDateString()}
                            </p>
                        </div>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded transition-all text-slate-600"
                        >
                            <TrashIcon className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

export default SessionList;
