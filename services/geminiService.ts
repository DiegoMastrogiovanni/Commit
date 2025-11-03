
import { GoogleGenAI, Type } from "@google/genai";
import { type DataRow } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder check. The environment variable is expected to be set.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const dataToString = (data: DataRow[]): string => {
    if(data.length === 0) return "";
    const headers = Object.keys(data[0]);
    const headerRow = headers.join(',');
    const dataRows = data.map(row => 
        headers.map(header => {
            const value = row[header];
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value;
        }).join(',')
    ).join('\n');

    return `${headerRow}\n${dataRows}`;
}

export const analyzeSchemaWithGemini = async (data: DataRow[]): Promise<any[]> => {
    if (!API_KEY) {
        return Promise.reject(new Error("Gemini API key is not configured."));
    }
    const dataSample = data.slice(0, 10);
    if (dataSample.length === 0) return [];

    const headers = Object.keys(dataSample[0] || {});
    const sampleForPrompt = dataToString(dataSample);

    const prompt = `
        Based on the following column headers and data sample, act as a database architect and define a schema.
        For each column, determine a likely data type (e.g., Text, Integer, Decimal, Date, Boolean), suggest a standard SQL data type (e.g., VARCHAR(255), INTEGER, DECIMAL(10, 2), DATE, BOOLEAN), and provide a brief description of its purpose.
        
        Headers: ${headers.join(', ')}

        Data Sample:
        ${sampleForPrompt}
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            fieldName: {
                                type: Type.STRING,
                                description: "The name of the column/field."
                            },
                            inferredType: {
                                type: Type.STRING,
                                description: "The suggested general data type (e.g., Text, Integer, Date, Boolean)."
                            },
                            sqlType: {
                                type: Type.STRING,
                                description: "The suggested SQL data type (e.g., VARCHAR(255), INTEGER, DATE)."
                            },
                            description: {
                                type: Type.STRING,
                                description: "A brief description of what this field represents."
                            }
                        },
                        required: ["fieldName", "inferredType", "sqlType", "description"]
                    }
                }
            }
        });

        const jsonText = response.text.trim();
        const schema = JSON.parse(jsonText);
        return schema;

    } catch (error) {
        console.error("Error calling Gemini API for schema analysis:", error);
        throw new Error("Failed to get schema analysis from AI. Please check the console for details.");
    }
};


export const analyzeDataWithGemini = async (data: DataRow[]): Promise<string> => {
  if (!API_KEY) {
    return Promise.reject(new Error("Gemini API key is not configured."));
  }
  
  // Take a sample of the data to avoid sending too much
  const dataSample = data.slice(0, 20);
  const dataSampleString = dataToString(dataSample);
  const totalRecords = data.length;
  const uniqueColumns = Object.keys(data[0] || {}).length;

  const prompt = `
    You are a data analysis assistant. I have consolidated data from multiple CSV files.
    Here is a sample of the data (${dataSample.length} rows out of ${totalRecords} total):

    --- DATA SAMPLE (CSV) ---
    ${dataSampleString}
    --- END OF DATA SAMPLE ---

    Please provide a brief summary of the consolidated dataset. 
    Your analysis should be in markdown format and include:
    1.  A confirmation of the total number of records (${totalRecords}) and unique columns (${uniqueColumns}) found.
    2.  An observation about the different columns (fields) available.
    3.  A brief comment on potential data quality based *only* on the provided sample (e.g., mention if you see many empty values).
    4.  An interesting insight or pattern you can infer from this small sample.

    Keep the summary concise and easy to read.
    `;
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    throw new Error("Failed to get analysis from AI. Please check the console for details.");
  }
};

export const generatePivotAnalysisWithGemini = async (data: DataRow[]): Promise<string> => {
    if (!API_KEY) {
        return Promise.reject(new Error("Gemini API key is not configured."));
    }
    
    const dataSample = data.slice(0, 50); // Use a slightly larger sample for pivot analysis
    const dataSampleString = dataToString(dataSample);
    const totalRecords = data.length;

    const prompt = `
      You are a data analysis assistant. Your task is to identify potential categorical columns from a data sample and create a summary count for each, similar to a pivot table.

      Here is a sample of the data (${dataSample.length} rows out of ${totalRecords} total):

      --- DATA SAMPLE (CSV) ---
      ${dataSampleString}
      --- END OF DATA SAMPLE ---

      Please perform the following steps:
      1.  Identify up to 3 columns that appear to be categorical (e.g., they contain repeating text values like status, type, or location). Ignore columns with unique IDs or very high cardinality.
      2.  For each of these columns, count the occurrences of each unique value *within this sample*.
      3.  Present your findings in markdown format. For each column, use a heading for the column name followed by a table listing the values and their counts.

      Example output for a column named 'Status':
      ### Status
      | Value | Count |
      |---|---|
      | Complete | 15 |
      | Pending | 5 |

      If no clear categorical columns are found in the sample, simply state that and explain why.
      `;
      
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });
      return response.text;
    } catch (error) {
      console.error("Error calling Gemini API for pivot analysis:", error);
      throw new Error("Failed to get pivot analysis from AI. Please check the console for details.");
    }
};
