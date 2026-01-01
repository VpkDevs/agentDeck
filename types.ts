
export type PromptCategory = 'Coding' | 'Creative' | 'Productivity' | 'System' | 'Education';

export interface Prompt {
  id: string;
  title: string;
  author: string;
  description: string;
  prompt: string;
  tags: string[];
  category: PromptCategory;
  likes: number;
  usageCount: number;
}

export interface Attachment {
  type: 'image' | 'text';
  content: string; // Base64 for image, plain text for text
  mimeType: string;
  name: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  attachments?: Attachment[];
  suggestions?: string[];
  sources?: { title: string; uri: string }[];
}

export interface Profile {
  userName: string;
  creativity: number;
  conciseness: number;
  formality: number;
  useEmojis: boolean;
  askClarifyingQuestions: boolean;
}

export type SessionType = 'chat' | 'document' | 'image';

export interface BaseSession {
  id: string;
  name: string;
  messages: ChatMessage[];
  updatedAt: number;
  promptId?: string;
}

export interface ChatSession extends BaseSession {
  type: 'chat';
}

export interface DocumentSession extends BaseSession {
  type: 'document';
  documentContent: string;
  summary: string;
}

export interface ImageSession extends BaseSession {
  type: 'image';
  imageBase64: string;
  mimeType: string;
}

export type AnySession = ChatSession | DocumentSession | ImageSession;
export type Session = AnySession;
