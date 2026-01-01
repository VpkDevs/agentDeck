
import React, { useState, useMemo } from 'react';
import { AnySession, Prompt, SessionType } from '../types';
import SessionCard from './SessionCard';
import { PlusIcon, DocumentIcon, ImageIcon, ChatBubbleIcon } from './icons';

interface SessionSidebarProps {
  sessions: AnySession[];
  prompts: Prompt[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewSession: (type: SessionType) => void;
  isProcessingFile: boolean;
}

const TABS: { type: SessionType; label: string; icon: React.FC<{className?: string}> }[] = [
    { type: 'chat', label: 'Chats', icon: ChatBubbleIcon },
    { type: 'document', label: 'Documents', icon: DocumentIcon },
    { type: 'image', label: 'Images', icon: ImageIcon },
];

const SessionSidebar: React.FC<SessionSidebarProps> = ({ sessions, prompts, activeSessionId, onSelectSession, onNewSession, isProcessingFile }) => {
  const [activeTab, setActiveTab] = useState<SessionType>('chat');

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => s.type === activeTab);
  }, [sessions, activeTab]);
  
  const getButtonText = () => {
    if (isProcessingFile) return 'Processing...';
    switch (activeTab) {
        case 'chat': return 'New Chat';
        case 'document': return 'New Document';
        case 'image': return 'New Image';
    }
  }

  return (
    <div className="bg-slate-800/50 rounded-lg flex flex-col h-full">
      <div className="p-2 border-b border-slate-700">
        <div className="flex bg-slate-900 rounded-lg p-1 space-x-1">
            {TABS.map(tab => (
                <button
                    key={tab.type}
                    onClick={() => setActiveTab(tab.type)}
                    className={`flex-1 flex items-center justify-center text-sm font-semibold py-2 rounded-md transition-colors ${activeTab === tab.type ? 'bg-slate-700 text-white' : 'text-slate-400 hover:bg-slate-800'}`}
                >
                    <tab.icon className="w-5 h-5 mr-2" />
                    {tab.label}
                </button>
            ))}
        </div>
      </div>
      <div className="p-4 border-b border-slate-700">
        <button
          onClick={() => onNewSession(activeTab)}
          disabled={isProcessingFile}
          className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-wait text-white font-bold py-3 px-4 rounded-lg transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          {getButtonText()}
        </button>
      </div>
      <div className="overflow-y-auto p-4 space-y-3 flex-grow">
        {filteredSessions.map(session => {
          const prompt = session.type === 'chat' ? prompts.find(p => p.id === session.promptId) : null;
          if (session.type === 'chat' && !prompt) return null;
          return (
            <SessionCard
              key={session.id}
              session={session}
              prompt={prompt}
              isSelected={session.id === activeSessionId}
              onSelect={onSelectSession}
            />
          );
        })}
        {filteredSessions.length === 0 && (
          <div className="text-center py-10 px-4">
            <p className="text-slate-400 font-semibold">No active {activeTab}s.</p>
            <p className="text-slate-500 text-sm mt-1">Click the "New" button above to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSidebar;
