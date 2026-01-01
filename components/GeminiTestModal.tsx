
import React, { useState, useCallback } from 'react';
import { Prompt, Profile } from '../types';
import { testSystemPrompt } from '../services/geminiService';
import { CloseIcon, SparklesIcon } from './icons';

interface GeminiTestModalProps {
  prompt: Prompt;
  profile: Profile;
  onClose: () => void;
}

const GeminiTestModal: React.FC<GeminiTestModalProps> = ({ prompt, profile, onClose }) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleGenerate = useCallback(async () => {
    if (!userPrompt.trim()) return;
    setIsLoading(true);
    setResponse('');
    const result = await testSystemPrompt(prompt, profile, userPrompt);
    setResponse(result);
    setIsLoading(false);
  }, [userPrompt, prompt, profile]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <h2 className="text-xl font-bold text-slate-100">Test Prompt: <span className="text-cyan-400">{prompt.title}</span></h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">System Prompt (Instruction)</label>
            <div className="bg-slate-900 p-3 rounded-md text-sm text-slate-300 max-h-32 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono">{prompt.prompt}</pre>
            </div>
          </div>

          <div>
            <label htmlFor="userPrompt" className="block text-sm font-medium text-slate-400 mb-2">Your Message</label>
            <textarea
              id="userPrompt"
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Enter your message here to test the system prompt..."
              rows={4}
              className="w-full bg-slate-700 border border-slate-600 rounded-md p-3 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition"
            />
          </div>

          {response && (
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Gemini's Response</label>
              <div className="bg-slate-900 p-4 rounded-md text-sm text-slate-300 prose prose-invert prose-p:text-slate-300 max-w-none">
                 <pre className="whitespace-pre-wrap font-sans">{response}</pre>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-700 mt-auto flex-shrink-0">
          <button
            onClick={handleGenerate}
            disabled={isLoading || !userPrompt.trim()}
            className="w-full flex items-center justify-center bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-lg transition-all duration-300"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
                <>
                <SparklesIcon className="w-5 h-5 mr-2" />
                Generate Response
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GeminiTestModal;
