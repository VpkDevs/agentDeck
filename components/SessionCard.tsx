
import React from 'react';
import { AnySession, Prompt } from '../types';
import { DocumentIcon, ImageIcon } from './icons';

interface SessionCardProps {
  session: AnySession;
  prompt: Prompt | null; // Null for non-chat sessions
  isSelected: boolean;
  onSelect: (id: string) => void;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, prompt, isSelected, onSelect }) => {
  const getPreview = () => {
    switch (session.type) {
      case 'chat':
        const lastUserMessage = session.messages.slice().reverse().find(m => m.role === 'user' && m.content);
        return lastUserMessage ? `You: ${lastUserMessage.content}` : 'Ready for your first message.';
      case 'document':
        return `Doc: ${session.name}`;
      case 'image':
        return `Img: ${session.name}`;
      default:
        return '...';
    }
  };

  const title = session.type === 'chat' && prompt ? prompt.title : session.name;
  const previewText = getPreview().replace(/[*_`]/g, '');

  const Icon = () => {
    switch (session.type) {
        case 'document': return <DocumentIcon className="w-4 h-4 text-slate-400 mr-2" />;
        case 'image': return <ImageIcon className="w-4 h-4 text-slate-400 mr-2" />;
        default: return null;
    }
  }

  return (
    <div
      onClick={() => onSelect(session.id)}
      className={`p-4 rounded-xl cursor-pointer transition-all duration-200 border-2 ${isSelected ? 'bg-slate-700 border-purple-500' : 'bg-slate-800 border-transparent hover:border-slate-600'}`}
      role="button"
      aria-pressed={isSelected}
      tabIndex={0}
    >
      <h3 className="font-bold text-white truncate flex items-center">
        <Icon />
        {title}
      </h3>
      <p className="text-sm text-slate-400 mt-1 h-10 overflow-hidden text-ellipsis">
        {previewText}
      </p>
    </div>
  );
};

export default SessionCard;
