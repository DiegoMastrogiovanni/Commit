
import React, { useState, useCallback, useMemo } from 'react';
import { processFiles } from './services/dataProcessor';
import { analyzeDataWithGemini, generatePivotAnalysisWithGemini, analyzeSchemaWithGemini } from './services/geminiService';
import { type DataRow } from './types';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import AnalysisCard from './components/AnalysisCard';
import SchemaAnalysisCard from './components/SchemaAnalysisCard';
import { LoaderIcon, AnalyzeIcon, DownloadIcon } from './components/Icons';
import Header from './components/Header';
import { validateFiles } from './services/fileValidator';

declare const Papa: any;

const App: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [validFiles, setValidFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<DataRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingPivot, setIsGeneratingPivot] = useState<boolean>(false);
  const [isAnalyzingSchema, setIsAnalyzingSchema] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [pivotAnalysis, setPivotAnalysis] = useState<string | null>(null);
  const [schemaAnalysis, setSchemaAnalysis] = useState<any[] | null>(null);

  const handleFileChange = useCallback(async (selectedFiles: FileList | null) => {
    setFiles(selectedFiles);
    // Reset state when new files are selected
    setData([]);
    setHeaders([]);
    setError(null);
    setAnalysis(null);
    setPivotAnalysis(null);
    setSchemaAnalysis(null);
    setValidationErrors([]);
    setProcessingErrors([]);
    setValidFiles([]);

    if (selectedFiles && selectedFiles.length > 0) {
      const { validFiles: newValidFiles, errors: newValidationErrors } = await validateFiles(selectedFiles);
      setValidFiles(newValidFiles);
      if (newValidationErrors.length > 0) {
        const messages = newValidationErrors.map(e => `"${e.fileName}" was discarded: ${e.reason}`);
        setValidationErrors(messages);
      }
    }
  }, []);

  const handleProcessFiles = useCallback(async () => {
    if (validFiles.length === 0) {
      setError('Please select at least one valid CSV file to process.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setAnalysis(null);
    setPivotAnalysis(null);
    setSchemaAnalysis(null);
    setProcessingErrors([]);

    try {
      const { headers: newHeaders, data: newData, errors: newProcessingErrors } = await processFiles(validFiles);
      
      setHeaders(newHeaders);
      setData(newData);

      if (newProcessingErrors.length > 0) {
          const messages = newProcessingErrors.map(e => `"${e.fileName}" was skipped during processing: ${e.reason}`);
          setProcessingErrors(messages);
      }
      
      if (newData.length === 0 && validFiles.length > 0) {
          setError("No data could be consolidated. Please check the file contents and processing notices.");
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during processing.');
      setData([]);
      setHeaders([]);
    } finally {
      setIsProcessing(false);
    }
  }, [validFiles]);

  const handleAnalyzeData = useCallback(async () => {
    if (data.length === 0) {
      setError('No data available to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis('');

    try {
      const result = await analyzeDataWithGemini(data);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
      setAnalysis(null);
    } finally {
      setIsAnalyzing(false);
    }
  }, [data]);
  
  const handleGeneratePivotSummary = useCallback(async () => {
    if (data.length === 0) {
      setError('No data available to analyze for pivot summary.');
      return;
    }

    setIsGeneratingPivot(true);
    setError(null);
    setPivotAnalysis('');

    try {
      const result = await generatePivotAnalysisWithGemini(data);
      setPivotAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during pivot analysis.');
      setPivotAnalysis(null);
    } finally {
      setIsGeneratingPivot(false);
    }
  }, [data]);
  
  const handleAnalyzeSchema = useCallback(async () => {
    if (data.length === 0) {
      setError('No data available to analyze schema.');
      return;
    }

    setIsAnalyzingSchema(true);
    setError(null);
    setSchemaAnalysis(null);

    try {
      const result = await analyzeSchemaWithGemini(data);
      setSchemaAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during schema analysis.');
      setSchemaAnalysis(null);
    } finally {
      setIsAnalyzingSchema(false);
    }
  }, [data]);

  const handleExportData = () => {
    if (data.length === 0) return;
    const csv = Papa.unparse(data);
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'consolidated_data.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportReport = () => {
      if (!analysis && !pivotAnalysis) return;
      let reportContent = '';
      if (analysis) {
          reportContent += '# AI Analysis Summary\n\n' + analysis + '\n\n---\n\n';
      }
      if (pivotAnalysis) {
          reportContent += '# AI Pivot Summary\n\n' + pivotAnalysis;
      }
      const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', 'ai_report.md');
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const hasData = useMemo(() => data.length > 0, [data]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-teal-300 mb-4">Step 1: Upload Files</h2>
            <p className="text-gray-400 mb-4">Select one or more CSV or Excel files. The tool will process all sheets within Excel files and unify all columns into a single table. Files or sheets that cannot be parsed will be automatically skipped.</p>
            <FileUpload onFileChange={handleFileChange} />
            {validationErrors.length > 0 && (
              <div className="mt-4 bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg" role="alert">
                <p className="font-bold text-yellow-200">Validation Notice:</p>
                <ul className="mt-2 list-disc list-inside text-sm text-yellow-300">
                  {validationErrors.map((msg, i) => <li key={i}>{msg}</li>)}
                </ul>
              </div>
            )}
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleProcessFiles}
              disabled={validFiles.length === 0 || isProcessing}
              className="px-8 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center"
            >
              {isProcessing ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />Processing...</> : `Process ${validFiles.length > 0 ? validFiles.length : ''} Valid File(s)`}
            </button>
          </div>

          {error && <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg" role="alert">{error}</div>}

          {processingErrors.length > 0 && (
            <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-lg" role="alert">
              <p className="font-bold text-yellow-200">Processing Notice:</p>
              <ul className="mt-2 list-disc list-inside text-sm text-yellow-300">
                {processingErrors.map((msg, i) => <li key={i}>{msg}</li>)}
              </ul>
            </div>
          )}
          
          {hasData && (
             <>
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-teal-300">Step 2: Review Consolidated Data</h2>
                <p className="text-gray-400 mt-1 mb-4">{data.length} records consolidated.</p>
                <DataTable headers={headers} data={data} />
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-teal-300">Step 3: Analyze & Export</h2>
                <p className="text-gray-400 mt-1 mb-6">Use our AI tools to identify key insights and define a database schema. When you're ready, export your findings for your local database.</p>
                
                <div className="space-y-6">
                   <div className="flex flex-col md:flex-row gap-4 items-center flex-wrap">
                      <button onClick={handleAnalyzeSchema} disabled={isAnalyzingSchema} className="w-full md:w-auto px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 disabled:bg-gray-600 transition-all duration-300 flex items-center justify-center">
                        {isAnalyzingSchema ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Analyzing Schema...</> : <><AnalyzeIcon className="mr-2 h-5 w-5" />Analyze Schema</>}
                      </button>
                      <button onClick={handleAnalyzeData} disabled={isAnalyzing} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-600 transition-all duration-300 flex items-center justify-center">
                        {isAnalyzing ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Analyzing...</> : <><AnalyzeIcon className="mr-2 h-5 w-5" />Analyze with AI</>}
                      </button>
                      {analysis && (
                        <button onClick={handleGeneratePivotSummary} disabled={isGeneratingPivot} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-600 transition-all duration-300 flex items-center justify-center">
                          {isGeneratingPivot ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Generating...</> : <><AnalyzeIcon className="mr-2 h-5 w-5" />Generate AI Pivot Summary</>}
                        </button>
                      )}
                    </div>
                    
                    {schemaAnalysis && <SchemaAnalysisCard schema={schemaAnalysis} />}
                    {analysis && <AnalysisCard title="AI Analysis Summary" content={analysis} />}
                    {pivotAnalysis && <AnalysisCard title="AI Pivot Summary" content={pivotAnalysis} />}
                    
                    <div className="border-t border-gray-700 pt-6">
                        <p className="text-gray-400 mb-4">Download the consolidated data as a CSV file, perfect for importing into Microsoft Access or other database tools.</p>
                        <div className="flex flex-col md:flex-row gap-4">
                           <button onClick={handleExportData} className="w-full md:w-auto flex items-center justify-center px-6 py-2 border border-teal-500 text-teal-300 font-semibold rounded-lg hover:bg-teal-500/20 transition-colors">
                                <DownloadIcon className="mr-2 h-5 w-5" />
                                Download Data (.csv)
                           </button>
                            <button onClick={handleExportReport} disabled={!analysis && !pivotAnalysis} className="w-full md:w-auto flex items-center justify-center px-6 py-2 border border-indigo-500 text-indigo-300 font-semibold rounded-lg hover:bg-indigo-500/20 transition-colors disabled:border-gray-600 disabled:text-gray-500 disabled:hover:bg-transparent">
                                <DownloadIcon className="mr-2 h-5 w-5" />
                                Download Report (.md)
                            </button>
                        </div>
                    </div>
                </div>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
};

export default App;
