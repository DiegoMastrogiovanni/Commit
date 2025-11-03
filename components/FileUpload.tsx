
import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileChange: (files: FileList | null) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      setSelectedFiles(Array.from(files));
      onFileChange(files);
    }
  }, [onFileChange]);

  const fileList = selectedFiles.length > 0 && (
    <ul className="mt-4 space-y-2 text-sm text-gray-400">
      {selectedFiles.map((file, index) => (
        <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
          <span className="truncate pr-2">{file.name}</span>
          <span className="flex-shrink-0">{(file.size / 1024).toFixed(2)} KB</span>
        </li>
      ))}
    </ul>
  );

  return (
    <div>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className="flex flex-col items-center justify-center w-full h-48 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-700 hover:bg-gray-600 transition-colors"
        >
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
            <p className="mb-2 text-sm text-gray-400">
              <span className="font-semibold text-teal-400">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">CSV and Excel (.xlsx, .xls) files supported</p>
          </div>
          <input
            id="dropzone-file"
            type="file"
            className="hidden"
            multiple
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleFileSelect}
          />
        </label>
      </div>
      {fileList}
    </div>
  );
};

export default FileUpload;
