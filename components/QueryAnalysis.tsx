
import React, { useState } from 'react';
import { SparklesIcon, LoaderIcon } from './Icons';

interface QueryAnalysisProps {
    onAskQuery: (question: string) => void;
    answer: string | null;
    error: string | null;
    isLoading: boolean;
}

const QueryAnalysis: React.FC<QueryAnalysisProps> = ({ onAskQuery, answer, error, isLoading }) => {
    const [question, setQuestion] = useState('');

    const handleSubmit = () => {
        if (!question.trim() || isLoading) return;
        onAskQuery(question);
    };
    
    // Simple markdown-to-HTML
    const formatContent = (content: string) => {
        return content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-teal-300 px-1 rounded">$1</code>')
            .split('\n')
            .filter(line => line.trim() !== '')
            .map(line => `<p>${line}</p>`)
            .join('');
    };

    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-teal-300">Step 3: Ask a Question</h2>
            <p className="text-gray-400 mt-1 mb-4">
                Ask a specific question about your data. The AI will analyze a sample of your records to find an answer.
            </p>

            <div className="space-y-4">
                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="e.g., What is the average value for the 'Price' column? or How many records have 'Status' as 'Completed'?"
                    className="w-full p-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all text-sm"
                    rows={3}
                    disabled={isLoading}
                />
                <button
                    onClick={handleSubmit}
                    disabled={isLoading || !question.trim()}
                    className="px-6 py-2 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center justify-center"
                >
                    {isLoading ? (
                        <>
                            <LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />
                            Thinking...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="mr-2 h-5 w-5" />
                            Ask AI
                        </>
                    )}
                </button>
            </div>
            
            {(isLoading || error || answer) && (
                 <div className="mt-6 border-t border-gray-700 pt-6">
                    <h4 className="text-md font-semibold text-gray-300 mb-3">AI Response:</h4>
                    {isLoading && !answer && (
                         <div className="flex items-center space-x-2 text-gray-400">
                             <LoaderIcon className="animate-spin h-4 w-4" />
                             <span>Analyzing your data to find an answer...</span>
                         </div>
                    )}
                    {error && (
                        <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
                            {error}
                        </div>
                    )}
                    {answer && (
                        <div 
                            className="prose prose-invert prose-sm text-gray-300 max-w-none space-y-2"
                            dangerouslySetInnerHTML={{ __html: formatContent(answer) }}
                        />
                    )}
                 </div>
            )}
        </div>
    );
};

export default QueryAnalysis;
