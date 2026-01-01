
import React, { useState } from 'react';
import { Prompt, PromptCategory } from '../types';
import { CloseIcon } from './icons';

interface PromptFormProps {
  onClose: () => void;
  onSubmit: (newPrompt: Omit<Prompt, 'id' | 'likes' | 'usageCount'>) => void;
}

const CATEGORIES: PromptCategory[] = ['Coding', 'Creative', 'Productivity', 'System', 'Education'];

const PromptForm: React.FC<PromptFormProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [prompt, setPromptText] = useState('');
  const [category, setCategory] = useState<PromptCategory>('Coding');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof Omit<Prompt, 'id' | 'tags' | 'likes' | 'usageCount'> | 'tags', string>>>({});

  const validate = () => {
    const newErrors: typeof errors = {};
    if (!title.trim()) newErrors.title = "Title is required.";
    if (!author.trim()) newErrors.author = "Author handle is required.";
    if (!description.trim()) newErrors.description = "Description is required.";
    if (!prompt.trim()) newErrors.prompt = "The system instruction text is required.";
    if (!tags.trim()) newErrors.tags = "At least one tag is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        title,
        author,
        description,
        prompt,
        category,
        tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/50">
          <h2 className="text-xl font-bold text-slate-100">Contribute an Agent</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 transition-colors">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="title" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Agent Title</label>
              <input type="text" id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. React Reviewer" className={`w-full bg-slate-700/50 border rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.title ? 'border-red-500' : 'border-slate-600'}`} />
            </div>
            <div>
              <label htmlFor="author" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Author Handle</label>
              <input type="text" id="author" value={author} onChange={e => setAuthor(e.target.value)} placeholder="@yourname" className={`w-full bg-slate-700/50 border rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.author ? 'border-red-500' : 'border-slate-600'}`} />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Category</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${category === cat ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Description</label>
            <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this agent do best?" rows={2} className={`w-full bg-slate-700/50 border rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.description ? 'border-red-500' : 'border-slate-600'}`}></textarea>
          </div>

          <div>
            <label htmlFor="prompt" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">System Instructions</label>
            <textarea id="prompt" value={prompt} onChange={e => setPromptText(e.target.value)} placeholder="You are a specialized assistant..." rows={6} className={`w-full bg-slate-700/50 border rounded-xl p-3 font-mono text-sm text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.prompt ? 'border-red-500' : 'border-slate-600'}`}></textarea>
            <p className="text-[10px] text-slate-500 mt-1">Pro-tip: Include specific rules, tone guidelines, and output formats.</p>
          </div>

          <div>
            <label htmlFor="tags" className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tags (comma-separated)</label>
            <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="coding, react, typescript..." className={`w-full bg-slate-700/50 border rounded-xl p-3 text-slate-200 focus:ring-2 focus:ring-purple-500 outline-none transition-all ${errors.tags ? 'border-red-500' : 'border-slate-600'}`} />
          </div>
        </form>
         <div className="p-4 border-t border-slate-700 bg-slate-900/50">
          <button 
            type="submit" 
            onClick={handleSubmit} 
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-900/20 active:scale-[0.98]"
          >
            Publish Agent
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptForm;
