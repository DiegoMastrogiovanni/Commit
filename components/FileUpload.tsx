import React, { useState, useCallback } from 'react';
import { UploadIcon } from './Icons';

interface FileUploadProps {
  onFileChange: (files: FileList | null) => void;
}

const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];
const ALLOWED_MIME_TYPES = [
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange }) => {
  const [validFiles, setValidFiles] = useState<File[]>([]);
  const [checkedState, setCheckedState] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const reportCheckedFiles = useCallback((files: File[], checks: Record<string, boolean>) => {
      const checkedFiles = files.filter(file => checks[file.name]);
      const dataTransfer = new DataTransfer();
      checkedFiles.forEach(file => dataTransfer.items.add(file));
      onFileChange(dataTransfer.files.length > 0 ? dataTransfer.files : null);
  }, [onFileChange]);

  const validateAndSetFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) {
      setValidFiles([]);
      setCheckedState({});
      setErrors([]);
      onFileChange(null);
      return;
    }

    const files = Array.from(fileList);
    const newValidFiles: File[] = [];
    const currentErrors: string[] = [];
    const newCheckedState: Record<string, boolean> = {};

    files.forEach(file => {
      const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const isValidExtension = ALLOWED_EXTENSIONS.includes(extension);
      const isValidMimeType = !file.type || ALLOWED_MIME_TYPES.includes(file.type);
      
      if (isValidExtension && isValidMimeType) {
        newValidFiles.push(file);
        newCheckedState[file.name] = true; // Default to checked
      } else {
        currentErrors.push(`'${file.name}' is not a supported file type. Please use CSV, XLSX, or XLS.`);
      }
    });
    
    setValidFiles(newValidFiles);
    setCheckedState(newCheckedState);
    setErrors(currentErrors);
    reportCheckedFiles(newValidFiles, newCheckedState);

  }, [onFileChange, reportCheckedFiles]);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    validateAndSetFiles(event.target.files);
    event.target.value = '';
  }, [validateAndSetFiles]);
  
  const handleDragOver = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    validateAndSetFiles(event.dataTransfer.files);
  }, [validateAndSetFiles]);

  const handleIndividualCheck = (fileName: string) => {
    const newCheckedState = {
      ...checkedState,
      [fileName]: !checkedState[fileName],
    };
    setCheckedState(newCheckedState);
    reportCheckedFiles(validFiles, newCheckedState);
  };

  const handleSelectAllChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isChecked = e.target.checked;
    const newCheckedState = validFiles.reduce((acc, file) => {
        acc[file.name] = isChecked;
        return acc;
    }, {} as Record<string, boolean>);
    setCheckedState(newCheckedState);
    reportCheckedFiles(validFiles, newCheckedState);
  };

  const checkedCount = Object.values(checkedState).filter(Boolean).length;
  const isAllChecked = validFiles.length > 0 && checkedCount === validFiles.length;
  const isIndeterminate = validFiles.length > 0 && checkedCount > 0 && !isAllChecked;

  const dragDropClasses = isDragging 
    ? 'border-teal-400 bg-gray-600/50 ring-2 ring-teal-500' 
    : 'border-gray-600 bg-gray-700 hover:bg-gray-600';

  return (
    <div>
      <div className="flex items-center justify-center w-full">
        <label
          htmlFor="dropzone-file"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${dragDropClasses}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
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

      {errors.length > 0 && (
        <div className="mt-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">
            <p className="font-bold text-red-200">Invalid Files:</p>
            <ul className="mt-2 list-disc list-inside text-sm text-red-300">
                {errors.map((msg, i) => <li key={i}>{msg}</li>)}
            </ul>
        </div>
      )}

      {validFiles.length > 0 && (
        <div className="mt-4">
          {validFiles.length > 1 && (
            <div className="flex items-center p-2 mb-2 bg-gray-700/80 rounded-md border border-gray-600">
              <input
                type="checkbox"
                id="select-all-files"
                className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-teal-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-teal-500"
                checked={isAllChecked}
                ref={(input) => {
                  if (input) input.indeterminate = isIndeterminate;
                }}
                onChange={handleSelectAllChange}
              />
              <label htmlFor="select-all-files" className="ml-3 text-sm font-medium text-gray-300 select-none cursor-pointer">
                Select All Valid Files ({checkedCount} / {validFiles.length} selected)
              </label>
            </div>
          )}
          <ul className="space-y-2 text-sm text-gray-400">
            {validFiles.map((file, index) => (
              <li key={index} className="flex items-center justify-between bg-gray-700 p-2 rounded">
                <div className="flex items-center flex-1 min-w-0">
                    <input
                      type="checkbox"
                      id={`file-checkbox-${index}`}
                      className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-teal-500 focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-700 focus:ring-teal-500"
                      checked={checkedState[file.name] ?? false}
                      onChange={() => handleIndividualCheck(file.name)}
                    />
                    <label htmlFor={`file-checkbox-${index}`} className="ml-3 truncate pr-2 cursor-pointer select-none">{file.name}</label>
                </div>
                <span className="flex-shrink-0">{(file.size / 1024).toFixed(2)} KB</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
