
import React, { useState } from 'react';
import { Profile } from '../types';
import { CloseIcon, SparklesIcon } from './icons';

interface ProfileModalProps {
  profile: Profile;
  onClose: () => void;
  onSubmit: (newProfile: Profile) => void;
}

const Slider: React.FC<{ label: string, value: number, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, leftLabel: string, rightLabel: string }> =
  ({ label, value, onChange, leftLabel, rightLabel }) => (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-1">{label}</label>
      <input type="range" min="0" max="1" step="0.01" value={value} onChange={onChange} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500" />
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>{leftLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );

const Toggle: React.FC<{ label: string, checked: boolean, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, description: string }> =
  ({ label, checked, onChange, description }) => (
    <div className="flex justify-between items-center">
      <div>
          <label className="text-sm font-medium text-slate-300">{label}</label>
          <p className="text-xs text-slate-500">{description}</p>
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
        <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-focus:ring-2 peer-focus:ring-purple-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
      </label>
    </div>
  );

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onClose, onSubmit }) => {
  const [currentProfile, setCurrentProfile] = useState<Profile>(profile);

  const handleChange = (field: keyof Profile, value: any) => {
    setCurrentProfile(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSliderChange = (field: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(field, parseFloat(e.target.value));
  };
  
  const handleToggleChange = (field: keyof Profile) => (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(field, e.target.checked);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(currentProfile);
    onClose();
  };
  
  const setPreset = (preset: Partial<Profile>) => {
      setCurrentProfile(prev => ({...prev, ...preset}));
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-100">AI Personality & Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <CloseIcon />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="flex-grow flex flex-col">
          <div className="p-6 overflow-y-auto space-y-6">
            <div>
              <label htmlFor="userName" className="block text-sm font-medium text-slate-300">Your Name</label>
              <input type="text" id="userName" value={currentProfile.userName} onChange={e => handleChange('userName', e.target.value)} placeholder="How should the AI address you?" className="mt-1 block w-full bg-slate-700 border border-slate-600 rounded-md p-2 text-slate-200 focus:ring-2 focus:ring-purple-500 focus:border-purple-500" />
              <p className="text-xs text-slate-500 mt-1">This helps the AI personalize its responses.</p>
            </div>
            
            <div className="border-t border-slate-700 my-4"></div>

            <h3 className="text-lg font-semibold text-slate-200">Personality Presets</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <button type="button" onClick={() => setPreset({ creativity: 0.1, conciseness: 0.8, formality: 0.8, askClarifyingQuestions: true, useEmojis: false })} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors">Analytical</button>
                <button type="button" onClick={() => setPreset({ creativity: 0.8, conciseness: 0.2, formality: 0.2, askClarifyingQuestions: false, useEmojis: true })} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors">Creative</button>
                <button type="button" onClick={() => setPreset({ creativity: 0.5, conciseness: 0.5, formality: 0.5, askClarifyingQuestions: true, useEmojis: false })} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors">Balanced</button>
                <button type="button" onClick={() => setPreset({ creativity: 0.2, conciseness: 0.9, formality: 0.5, askClarifyingQuestions: true, useEmojis: false })} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-md text-sm transition-colors">Concise</button>
            </div>

            <div className="border-t border-slate-700 my-4"></div>

            <h3 className="text-lg font-semibold text-slate-200">Fine-Tune Personality</h3>
            <Slider label="Reasoning Style" value={currentProfile.creativity} onChange={handleSliderChange('creativity')} leftLabel="Analytical" rightLabel="Creative" />
            <Slider label="Verbosity Level" value={currentProfile.conciseness} onChange={handleSliderChange('conciseness')} leftLabel="Concise" rightLabel="Detailed" />
            <Slider label="Communication Tone" value={currentProfile.formality} onChange={handleSliderChange('formality')} leftLabel="Casual" rightLabel="Formal" />
            
            <div className="border-t border-slate-700 my-4"></div>
            
            <h3 className="text-lg font-semibold text-slate-200">Behavioral Rules</h3>
            <Toggle label="Use Emojis" checked={currentProfile.useEmojis} onChange={handleToggleChange('useEmojis')} description="Allow the AI to use emojis for a more expressive tone."/>
            <Toggle label="Ask Clarifying Questions" checked={currentProfile.askClarifyingQuestions} onChange={handleToggleChange('askClarifyingQuestions')} description="Enable the AI to ask for more details on ambiguous requests." />
          </div>
          <div className="p-4 border-t border-slate-700 mt-auto">
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors">
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
