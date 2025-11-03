
import React from 'react';

interface SchemaItem {
  fieldName: string;
  inferredType: string;
  sqlType: string;
  description: string;
}

interface SchemaAnalysisCardProps {
  schema: SchemaItem[];
}

const SchemaAnalysisCard: React.FC<SchemaAnalysisCardProps> = ({ schema }) => {
  if (!schema || schema.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 border border-orange-500/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-orange-300 mb-4">Inferred Database Schema</h3>
      <p className="text-sm text-gray-400 mb-4">
        Based on the consolidated data, here is a suggested database table structure. This "tracciato record" reflects the union of all columns from your source files.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="border-b-2 border-gray-600">
            <tr>
              <th className="p-2 pb-3 text-sm font-semibold text-gray-300">Field Name</th>
              <th className="p-2 pb-3 text-sm font-semibold text-gray-300">Inferred Type</th>
              <th className="p-2 pb-3 text-sm font-semibold text-gray-300">SQL Type</th>
              <th className="p-2 pb-3 text-sm font-semibold text-gray-300">Description</th>
            </tr>
          </thead>
          <tbody>
            {schema.map((item, index) => (
              <tr key={index} className="border-b border-gray-700 last:border-b-0">
                <td className="p-2 text-sm font-mono text-teal-300 whitespace-nowrap">{item.fieldName}</td>
                <td className="p-2 text-sm text-gray-300 whitespace-nowrap">{item.inferredType}</td>
                <td className="p-2 text-sm font-mono text-cyan-300 whitespace-nowrap">{item.sqlType}</td>
                <td className="p-2 text-sm text-gray-400">{item.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SchemaAnalysisCard;
