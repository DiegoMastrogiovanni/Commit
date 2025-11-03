
import { type DataRow } from '../types';

declare const Papa: any;
declare const XLSX: any;

interface PapaError {
    code: string;
    message: string;
    row: number;
    type: string;
}

interface ParseResult {
  data: { [key: string]: any }[];
  errors: PapaError[];
  meta: {
    fields: string[];
    delimiter?: string;
    encoding?: string;
  };
}

const parseCsvFile = (file: File): Promise<ParseResult> => {
  return new Promise(async (resolve, reject) => {
    const encodingsToTry = ['UTF-8', 'windows-1252', 'ISO-8859-1'];
    const delimitersToTry = [';', ',', '\t', '|'];

    let bestOverallResult: ParseResult | null = null;

    for (const encoding of encodingsToTry) {
      for (const delimiter of delimitersToTry) {
        try {
          const result = await new Promise<ParseResult>((resolveAttempt, rejectAttempt) => {
            Papa.parse(file, {
              header: true,
              skipEmptyLines: 'greedy',
              delimiter: delimiter,
              encoding: encoding,
              complete: (res: ParseResult) => {
                if (!res.meta.fields || res.meta.fields.length === 0) {
                  return rejectAttempt(new Error("Parsing produced no columns."));
                }
                
                if (res.errors.length > 0) {
                    console.warn(`[Parsing Notice] File: ${file.name}, Delimiter: '${delimiter}', Encoding: '${encoding}'. Errors:`, res.errors.map(e => e.message));
                }

                resolveAttempt(res);
              },
              error: (err: Error) => rejectAttempt(err),
            });
          });

          if (!bestOverallResult || result.meta.fields.length > bestOverallResult.meta.fields.length) {
            bestOverallResult = result;
            bestOverallResult.meta.encoding = encoding;
          }

        } catch (e) {
          // This combination of delimiter/encoding failed, just continue to the next one.
        }
      }
    }

    if (bestOverallResult) {
      console.log(`Best parse for ${file.name} found with delimiter: '${bestOverallResult.meta.delimiter}' and encoding: '${bestOverallResult.meta.encoding}'. Columns found: ${bestOverallResult.meta.fields.length}`);
      resolve(bestOverallResult);
    } else {
      reject(new Error(`Could not parse "${file.name}" with common delimiters and encodings. The file may be valid, but its internal structure could not be determined or it might be in an unsupported format.`));
    }
  });
};

const parseExcelFile = (file: File): Promise<ParseResult[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        if (!event.target?.result) {
          return resolve([]);
        }
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const results: ParseResult[] = [];
        
        workbook.SheetNames.forEach(sheetName => {
          const sheet = workbook.Sheets[sheetName];
          const jsonData: { [key: string]: any }[] = XLSX.utils.sheet_to_json(sheet, { defval: null, raw: false });
          
          if (jsonData.length > 0) {
            const fields = Object.keys(jsonData[0]).map(f => f.trim());
            const trimmedData = jsonData.map(row => {
              const newRow: {[key: string]: any} = {};
              for (const key in row) {
                if (Object.prototype.hasOwnProperty.call(row, key)) {
                  newRow[key.trim()] = row[key];
                }
              }
              return newRow;
            });

            results.push({
              data: trimmedData,
              errors: [],
              meta: { fields }
            });
          }
        });
        
        resolve(results);
      } catch (err) {
        console.error(`Error parsing Excel file ${file.name}:`, err);
        const message = err instanceof Error ? err.message : 'An unknown error occurred during parsing.';
        reject(new Error(`Failed to parse "${file.name}". The file might be corrupted. Details: ${message}`));
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};

const isBooleanString = (val: string): boolean => {
    const lower = val.toLowerCase();
    return lower === 'true' || lower === 'false' || lower === 'yes' || lower === 'no' || lower === '1' || lower === '0';
};

const toBoolean = (val: string): boolean => {
    const lower = val.toLowerCase();
    return lower === 'true' || lower === 'yes' || lower === '1';
};

const isIntegerString = (val: string): boolean => /^-?\d+$/.test(val);
const isNumberString = (val: string): boolean => !isNaN(parseFloat(val)) && isFinite(Number(val));

const inferAndConvertTypes = (headers: string[], data: DataRow[]): DataRow[] => {
    if (data.length === 0) return [];

    const columnTypes: { [key: string]: 'boolean' | 'integer' | 'number' | 'string' } = {};

    // 1. Infer types from a sample of up to 500 rows
    const sample = data.slice(0, 500);

    for (const header of headers) {
        let isPotentiallyBoolean = true;
        let isPotentiallyInteger = true;
        let isPotentiallyNumber = true;

        for (const row of sample) {
            const value = row[header];
            if (value === null || value === undefined || String(value).trim() === '') {
                continue; // Ignore empty values for type inference
            }
            
            const stringValue = String(value).trim();
            
            if (isPotentiallyBoolean && !isBooleanString(stringValue)) {
                isPotentiallyBoolean = false;
            }
            if (isPotentiallyInteger && !isIntegerString(stringValue)) {
                isPotentiallyInteger = false;
            }
            if (isPotentiallyNumber && !isNumberString(stringValue)) {
                isPotentiallyNumber = false;
            }
            
            if (!isPotentiallyBoolean && !isPotentiallyInteger && !isPotentiallyNumber) {
                break;
            }
        }
        
        if (isPotentiallyBoolean && sample.some(r => r[header] !== null && String(r[header]).trim() !== '')) columnTypes[header] = 'boolean';
        else if (isPotentiallyInteger) columnTypes[header] = 'integer';
        else if (isPotentiallyNumber) columnTypes[header] = 'number';
        else columnTypes[header] = 'string';
    }

    // 2. Convert the entire dataset based on inferred types
    return data.map(row => {
        const newRow: DataRow = { ...row };
        for (const header in newRow) {
            if (!Object.prototype.hasOwnProperty.call(newRow, header)) continue;

            const value = newRow[header];
            if (value === null || value === undefined || String(value).trim() === '') {
                newRow[header] = null; // Standardize empty values
                continue;
            }
            
            const stringValue = String(value).trim();
            const type = columnTypes[header];

            switch (type) {
                case 'boolean':
                    if (isBooleanString(stringValue)) {
                        newRow[header] = toBoolean(stringValue);
                    }
                    break;
                case 'integer':
                    if (isIntegerString(stringValue)) {
                       newRow[header] = parseInt(stringValue, 10);
                    }
                    break;
                case 'number':
                     if (isNumberString(stringValue)) {
                        newRow[header] = parseFloat(stringValue);
                     }
                    break;
            }
        }
        return newRow;
    });
};

export const processFiles = async (
  files: File[],
  onProgress?: (fileName: string, processedCount: number, totalCount: number) => void
): Promise<{ headers: string[]; data: DataRow[]; errors: { fileName: string; reason: string }[] }> => {
  const allResults: ParseResult[] = [];
  const processingErrors: { fileName: string; reason: string }[] = [];

  for (const [index, file] of files.entries()) {
    if (onProgress) {
      // Add a small delay for better UX on very fast processing
      await new Promise(resolve => setTimeout(resolve, 50));
      onProgress(file.name, index + 1, files.length);
    }
    
    try {
      const fileName = file.name.toLowerCase();
      if (fileName.endsWith('.csv')) {
        const result = await parseCsvFile(file);
        if (result.errors.length > 0) {
            result.errors.forEach(e => {
                processingErrors.push({
                    fileName: file.name,
                    // Papa's row is 0-indexed data row, so add 2 for 1-based line number with header
                    reason: `Line ${e.row + 2}: ${e.message} (Code: ${e.code})`,
                });
            });
        }
        if (result.data.length > 0) {
            allResults.push(result);
        } else if (result.errors.length === 0) { // Only report empty if no other parsing errors occurred
            processingErrors.push({ fileName: file.name, reason: 'File contains no data rows and was skipped.' });
        }
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
        const sheetResults = await parseExcelFile(file);
        if (sheetResults.length > 0) {
            allResults.push(...sheetResults);
        } else {
            processingErrors.push({ fileName: file.name, reason: 'File contains no sheets with data rows and was skipped.' });
        }
      }
    } catch (error) {
      console.error(`File processing failed for ${file.name}:`, error);
      const reason = error instanceof Error ? error.message : 'An unknown parsing error occurred.';
      processingErrors.push({ fileName: file.name, reason });
    }
  }

  if (allResults.length === 0) {
    return { headers: [], data: [], errors: processingErrors };
  }
  
  const unifiedHeaderSet = new Set<string>();
  allResults.forEach(result => {
    result.meta.fields.forEach(field => {
        if (field) unifiedHeaderSet.add(field.trim());
    });
  });
  const unifiedHeaders = Array.from(unifiedHeaderSet);

  const consolidatedData: DataRow[] = [];
  allResults.forEach(result => {
    result.data.forEach(row => {
      const trimmedRow: DataRow = {};
      for (const key in row) {
          if (Object.prototype.hasOwnProperty.call(row, key) && key) {
              trimmedRow[key.trim()] = row[key];
          }
      }
      
      const newRow: DataRow = {};
      unifiedHeaders.forEach(header => {
          newRow[header] = trimmedRow[header] !== undefined ? trimmedRow[header] : null;
      });
      consolidatedData.push(newRow);
    });
  });

  const typedData = inferAndConvertTypes(unifiedHeaders, consolidatedData);

  return { headers: unifiedHeaders, data: typedData, errors: processingErrors };
};
