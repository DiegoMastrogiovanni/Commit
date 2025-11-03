
import React from 'react';

interface AnalysisProgressProps {
  message: string;
}

const AnalysisProgress: React.FC<AnalysisProgressProps> = ({ message }) => {
  return (
    <div className="w-full my-6 bg-gray-800 border border-gray-700 rounded-lg p-6">
      <p className="text-center text-gray-300 mb-3 font-semibold">{message}</p>
      <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden relative">
        <div 
          className="absolute top-0 left-0 h-full bg-teal-500 rounded-full"
          style={{
            width: '40%',
            animation: 'indeterminate-progress 2s ease-in-out infinite'
          }}
        ></div>
        <style>
          {`
            @keyframes indeterminate-progress {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(350%); }
            }
          `}
        </style>
      </div>
       <p className="text-xs text-gray-500 text-center mt-2">AI is thinking... please wait.</p>
    </div>
  );
};

export default AnalysisProgress;
