
import React from 'react';

interface ProcessingProgressProps {
  currentFile: string;
  processedCount: number;
  totalCount: number;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  currentFile,
  processedCount,
  totalCount,
}) => {
  const percentage = totalCount > 0 ? (processedCount / totalCount) * 100 : 0;

  return (
    <div className="w-full max-w-md mx-auto my-3 text-center">
      <p className="text-sm text-gray-300 mb-2 truncate">
        Processing {processedCount} of {totalCount}: <span className="font-semibold text-teal-400">{currentFile}</span>
      </p>
      <div className="w-full bg-gray-700 rounded-full h-2.5">
        <div
          className="bg-teal-500 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProcessingProgress;
