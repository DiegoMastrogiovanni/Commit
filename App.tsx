
import React, { useState, useCallback, useMemo } from 'react';
import { processFiles } from './services/dataProcessor';
import { analyzeDataWithGemini, generatePivotAnalysisWithGemini, analyzeSchemaWithGemini } from './services/geminiService';
import { type DataRow } from './types';
import FileUpload from './components/FileUpload';
import DataTable from './components/DataTable';
import AnalysisCard from './components/AnalysisCard';
import SchemaAnalysisCard from './components/SchemaAnalysisCard';
import { LoaderIcon, AnalyzeIcon, DownloadIcon, ArchiveIcon } from './components/Icons';
import Header from './components/Header';
import { validateFiles } from './services/fileValidator';
import ProcessingProgress from './components/ProcessingProgress';
import AnalysisProgress from './components/AnalysisProgress';

declare const Papa: any;
declare const JSZip: any;

const App: React.FC = () => {
  const [files, setFiles] = useState<FileList | null>(null);
  const [validFiles, setValidFiles] = useState<File[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [processingErrors, setProcessingErrors] = useState<string[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<DataRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingProgress, setProcessingProgress] = useState<{
    currentFile: string;
    processedCount: number;
    totalCount: number;
  } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [isGeneratingPivot, setIsGeneratingPivot] = useState<boolean>(false);
  const [isAnalyzingSchema, setIsAnalyzingSchema] = useState<boolean>(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [pivotAnalysis, setPivotAnalysis] = useState<string | null>(null);
  const [schemaAnalysis, setSchemaAnalysis] = useState<any[] | null>(null);
  const [isPackaging, setIsPackaging] = useState<boolean>(false);

  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' } | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);

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
    setFilterText('');
    setSortConfig(null);
    setSearchHistory([]);

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
    setFilterText('');
    setSortConfig(null);
    setProcessingProgress({ currentFile: 'Initializing...', processedCount: 0, totalCount: validFiles.length });


    try {
      const onProgress = (fileName: string, processedCount: number, totalCount: number) => {
        setProcessingProgress({ currentFile: fileName, processedCount, totalCount });
      };

      const { headers: newHeaders, data: newData, errors: newProcessingErrors } = await processFiles(validFiles, onProgress);
      
      setHeaders(newHeaders);
      setData(newData);

      if (newProcessingErrors.length > 0) {
          const messages = newProcessingErrors.map(e => `"${e.fileName}": ${e.reason}`);
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
      setProcessingProgress(null);
    }
  }, [validFiles]);

  const handleAnalyzeData = useCallback(async () => {
    if (data.length === 0) {
      setError('No data available to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);

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
    setPivotAnalysis(null);

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

  const handleExportSchema = () => {
    if (!schemaAnalysis || schemaAnalysis.length === 0) return;
    const jsonString = JSON.stringify(schemaAnalysis, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'database_schema.json');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportProject = async () => {
    if (data.length === 0) return;

    setIsPackaging(true);
    try {
      const zip = new JSZip();

      // 1. Metadata
      const metadata = {
        exportedAt: new Date().toISOString(),
        sourceFiles: validFiles.map(f => f.name),
        totalRecords: data.length,
        totalHeaders: headers.length,
        validationNotices: validationErrors,
        processingNotices: processingErrors,
      };
      zip.file("metadata.json", JSON.stringify(metadata, null, 2));

      // 2. Consolidated Data
      const csv = Papa.unparse(data);
      zip.file("consolidated_data.csv", `\uFEFF${csv}`);

      // 3. Schema Analysis (if available)
      if (schemaAnalysis && schemaAnalysis.length > 0) {
        const jsonString = JSON.stringify(schemaAnalysis, null, 2);
        zip.file("database_schema.json", jsonString);
      }

      // 4. AI Reports (if available)
      if (analysis || pivotAnalysis) {
        let reportContent = '';
        if (analysis) {
          reportContent += '# AI Analysis Summary\n\n' + analysis + '\n\n---\n\n';
        }
        if (pivotAnalysis) {
          reportContent += '# AI Pivot Summary\n\n' + pivotAnalysis;
        }
        zip.file("ai_report.md", reportContent);
      }

      // Generate and download zip
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(content);
      link.href = url;
      link.download = "datasheet_consolidator_project.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (err) {
      setError(err instanceof Error ? `Failed to create project package: ${err.message}` : 'An unknown error occurred during packaging.');
    } finally {
      setIsPackaging(false);
    }
  };
  
  const requestSort = useCallback((key: string) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
        direction = 'descending';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  const addQueryToHistory = useCallback((query: string) => {
    if (!query.trim()) return;

    setSearchHistory(prev => {
        const newHistory = [query, ...prev.filter(h => h !== query)];
        return newHistory.slice(0, 5);
    });
  }, []);

  const filteredAndSortedData = useMemo(() => {
    if (!data) return [];
    let processableData = [...data];

    // Filter logic
    if (filterText) {
        const lowercasedFilter = filterText.toLowerCase();
        processableData = processableData.filter(row =>
            Object.values(row).some(value =>
                String(value).toLowerCase().includes(lowercasedFilter)
            )
        );
    }

    // Sort logic
    if (sortConfig !== null) {
        processableData.sort((a, b) => {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            
            if (valA === null || valA === undefined) return 1;
            if (valB === null || valB === undefined) return -1;

            const directionMultiplier = sortConfig.direction === 'ascending' ? 1 : -1;

            if (typeof valA === 'number' && typeof valB === 'number') {
                return (valA - valB) * directionMultiplier;
            }
            
            if (typeof valA === 'boolean' && typeof valB === 'boolean') {
                // True (1) comes after False (0)
                return (Number(valA) - Number(valB)) * directionMultiplier;
            }

            // Fallback to string comparison
            const strA = String(valA).toLowerCase();
            const strB = String(valB).toLowerCase();

            if (strA < strB) return -1 * directionMultiplier;
            if (strA > strB) return 1 * directionMultiplier;
            return 0;
        });
    }
    
    return processableData;
  }, [data, filterText, sortConfig]);

  const hasData = useMemo(() => data.length > 0, [data]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header recordCount={data.length} />
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

          <div className="flex justify-center items-center min-h-[52px]">
            {!isProcessing ? (
              <button
                onClick={handleProcessFiles}
                disabled={validFiles.length === 0}
                className="px-8 py-3 bg-teal-600 text-white font-bold rounded-lg shadow-md hover:bg-teal-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 flex items-center"
              >
                {`Process ${validFiles.length > 0 ? validFiles.length : ''} Valid File(s)`}
              </button>
            ) : (
              processingProgress && (
                <ProcessingProgress 
                  currentFile={processingProgress.currentFile}
                  processedCount={processingProgress.processedCount}
                  totalCount={processingProgress.totalCount}
                />
              )
            )}
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
                 <p className="text-gray-400 mt-1 mb-4">
                  {data.length} records consolidated. {filterText && `(${filteredAndSortedData.length} matching filter)`}
                </p>
                <DataTable 
                  headers={headers} 
                  data={filteredAndSortedData} 
                  sortConfig={sortConfig}
                  requestSort={requestSort}
                  filterText={filterText}
                  onFilterChange={setFilterText}
                  onFilterSubmit={addQueryToHistory}
                  searchHistory={searchHistory}
                />
              </div>

              <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-lg">
                <h2 className="text-xl font-semibold text-teal-300">Step 3: Analyze & Export</h2>
                <p className="text-gray-400 mt-1 mb-6">Use our AI tools to identify key insights and define a database schema. When you're ready, export your findings for your local database.</p>
                
                <div className="space-y-6">
                   <div className="flex flex-col md:flex-row gap-4 items-center flex-wrap">
                      <button onClick={handleAnalyzeSchema} disabled={isAnalyzingSchema || isAnalyzing || isGeneratingPivot} className="w-full md:w-auto px-6 py-2 bg-orange-600 text-white font-semibold rounded-lg shadow-md hover:bg-orange-700 disabled:bg-gray-600 transition-all duration-300 flex items-center justify-center">
                        {isAnalyzingSchema ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Analyzing Schema...</> : <><AnalyzeIcon className="mr-2 h-5 w-5" />Analyze Schema</>}
                      </button>
                       {schemaAnalysis && (
                          <button onClick={handleExportSchema} className="w-full md:w-auto flex items-center justify-center px-6 py-2 border border-orange-500 text-orange-300 font-semibold rounded-lg hover:bg-orange-500/20 transition-colors">
                              <DownloadIcon className="mr-2 h-5 w-5" />
                              Download Schema (.json)
                          </button>
                       )}
                      <button onClick={handleAnalyzeData} disabled={isAnalyzing || isAnalyzingSchema || isGeneratingPivot} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-600 transition-all duration-300 flex items-center justify-center">
                        {isAnalyzing ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Analyzing...</> : <><AnalyzeIcon className="mr-2 h-5 w-5" />Analyze with AI</>}
                      </button>
                      {analysis && (
                        <button onClick={handleGeneratePivotSummary} disabled={isGeneratingPivot || isAnalyzing || isAnalyzingSchema} className="w-full md:w-auto px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-gray-600 transition-all duration-300 flex items-center justify-center">
                          {isGeneratingPivot ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Generating...</> : <><AnalyzeIcon className="mr-2 h-5 w-5" />Generate AI Pivot Summary</>}
                        </button>
                      )}
                    </div>
                    
                    {isAnalyzingSchema && <AnalysisProgress message="Analyzing Schema with AI..." />}
                    {isAnalyzing && <AnalysisProgress message="Generating AI Analysis Summary..." />}
                    {isGeneratingPivot && <AnalysisProgress message="Generating AI Pivot Summary..." />}

                    {schemaAnalysis && <SchemaAnalysisCard schema={schemaAnalysis} />}
                    {analysis && <AnalysisCard title="AI Analysis Summary" content={analysis} />}
                    {pivotAnalysis && <AnalysisCard title="AI Pivot Summary" content={pivotAnalysis} />}
                    
                    <div className="border-t border-gray-700 pt-6 space-y-4">
                        <p className="text-gray-400 mb-2">Download a complete project package or individual files. The package is a ZIP archive containing all data and analyses.</p>
                        
                        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
                            <button 
                                onClick={handleExportProject} 
                                disabled={isPackaging}
                                className="w-full md:w-auto flex items-center justify-center px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 disabled:bg-gray-600 transition-all duration-300"
                            >
                                {isPackaging 
                                    ? <><LoaderIcon className="animate-spin -ml-1 mr-3 h-5 w-5" />Packaging...</> 
                                    : <><ArchiveIcon className="mr-2 h-5 w-5" />Download Project (.zip)</>
                                }
                            </button>
                        </div>

                        <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-gray-700/50">
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
