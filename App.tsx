
import React, { useState, useMemo, useCallback } from 'react';
import { Prompt, Session, Profile, ChatSession } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import AgentSidebar from './components/AgentSidebar';
import SessionList from './components/SessionList';
import Workspace from './components/Workspace';
import Header from './components/Header';
import PromptForm from './components/PromptForm';
import ProfileModal from './components/ProfileModal';
import LiveSession from './components/LiveSession';

// Initial data... (Kept brief for this snippet, same as before)
const initialPrompts: Prompt[] = [
    {
      id: 'c1',
      title: 'Senior Coding Architect',
      author: 'ArchitectAI',
      category: 'Coding',
      likes: 1240,
      usageCount: 8500,
      description: 'Specialized in system design, pattern implementation, and high-performance TypeScript/React.',
      prompt: `You are a world-class Senior Software Architect. Your task is to review and provide architectural guidance on code snippets.`,
      tags: ['coding', 'architecture', 'typescript', 'senior'],
    },
    {
        id: 'c2',
        title: 'TDD Coach',
        author: 'TestMaster',
        category: 'Coding',
        likes: 500,
        usageCount: 200,
        description: 'Strict Test-Driven Development enforcer.',
        prompt: 'You are a TDD coach. Always write tests before code.',
        tags: ['tdd', 'testing']
    }
];

const defaultProfile: Profile = {
  userName: 'User',
  creativity: 0.5,
  conciseness: 0.5,
  formality: 0.5,
  useEmojis: false,
  askClarifyingQuestions: true,
};

const App: React.FC = () => {
  const [prompts, setPrompts] = useLocalStorage<Prompt[]>('agentdeck-prompts', initialPrompts);
  const [sessions, setSessions] = useLocalStorage<Session[]>('agentdeck-sessions', []);
  const [profile, setProfile] = useLocalStorage<Profile>('agentdeck-profile', defaultProfile);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  
  // Modal State
  const [showPromptForm, setShowPromptForm] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showLive, setShowLive] = useState(false);

  // Derived State
  const activeSession = useMemo(() => sessions.find(s => s.id === activeSessionId) || null, [sessions, activeSessionId]);
  const activePrompt = useMemo(() => activeSession?.promptId ? prompts.find(p => p.id === activeSession.promptId) || null : null, [activeSession, prompts]);

  // Actions
  const handleSelectPrompt = (prompt: Prompt | null) => {
    // Creating a new session from a prompt (or raw chat if null)
    const newSession: ChatSession = {
        id: crypto.randomUUID(),
        name: prompt ? prompt.title : 'New Chat',
        type: 'chat',
        promptId: prompt?.id,
        messages: [],
        updatedAt: Date.now()
    };
    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSession.id);
  };

  const handleDeleteSession = (id: string) => {
      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeSessionId === id) setActiveSessionId(null);
  };

  const handleUpdateSession = (updatedSession: Session) => {
      setSessions(prev => prev.map(s => s.id === updatedSession.id ? updatedSession : s));
  };

  const handleAddPrompt = (newPromptData: Omit<Prompt, 'id' | 'likes' | 'usageCount'>) => {
      const newPrompt: Prompt = { ...newPromptData, id: crypto.randomUUID(), likes: 0, usageCount: 0 };
      setPrompts(prev => [newPrompt, ...prev]);
      setShowPromptForm(false);
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
      <Header onAddPrompt={() => setShowPromptForm(true)} onOpenProfile={() => setShowProfile(true)} />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel: Library */}
        <div className="w-[280px] flex-shrink-0 hidden md:flex flex-col">
            <AgentSidebar 
                prompts={prompts} 
                onSelect={handleSelectPrompt} 
                activePromptId={activePrompt?.id || null} 
                onAddAgent={() => setShowPromptForm(true)}
            />
        </div>

        {/* Center Panel: Workspace */}
        <div className="flex-1 flex flex-col bg-slate-900 relative">
             {activeSession ? (
                 <Workspace 
                    session={activeSession}
                    prompt={activePrompt}
                    profile={profile}
                    onUpdateSession={handleUpdateSession}
                 />
             ) : (
                 <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4">
                     <p>Select an Agent to begin</p>
                     <button onClick={() => setShowLive(true)} className="px-4 py-2 bg-blue-600 rounded-lg text-white font-bold">Try Live Audio</button>
                 </div>
             )}
        </div>

        {/* Right Panel: History */}
        <div className="w-[250px] flex-shrink-0 hidden lg:flex flex-col">
            <SessionList 
                sessions={sessions} 
                activeSessionId={activeSessionId} 
                onSelect={setActiveSessionId} 
                onDelete={handleDeleteSession} 
            />
        </div>
      </div>

      {/* Modals */}
      {showPromptForm && <PromptForm onClose={() => setShowPromptForm(false)} onSubmit={handleAddPrompt} />}
      {showProfile && <ProfileModal profile={profile} onClose={() => setShowProfile(false)} onSubmit={setProfile} />}
      {showLive && <LiveSession onClose={() => setShowLive(false)} />}
    </div>
  );
};

export default App;
