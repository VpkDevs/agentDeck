
import React from 'react';
import { SparklesIcon } from './icons';

interface SmartSuggestionsProps {
    suggestions: string[];
    onSuggestionClick: (suggestion: string) => void;
}

const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({ suggestions, onSuggestionClick }) => {
    if (!suggestions || suggestions.length === 0) {
        return null;
    }

    return (
        <div className="flex flex-col sm:flex-row items-start gap-3 mt-4 animate-fade-in-up">
             <div className="flex-shrink-0 flex items-center gap-2 text-sm text-cyan-400 font-semibold">
                <SparklesIcon className="w-5 h-5" />
                <span>Next up:</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionClick(suggestion)}
                        className="bg-slate-600/50 hover:bg-slate-600 text-slate-300 text-sm px-3 py-1.5 rounded-full transition-colors duration-200"
                    >
                        {suggestion}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default SmartSuggestions;
