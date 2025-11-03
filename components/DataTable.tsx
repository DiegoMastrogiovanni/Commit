
import React from 'react';
import { type DataRow } from '../types';

interface DataTableProps {
  headers: string[];
  data: DataRow[];
}

const DataTable: React.FC<DataTableProps> = ({ headers, data }) => {
  if (data.length === 0) {
    return <p className="text-center text-gray-500">No data to display.</p>;
  }

  return (
    <div className="w-full overflow-hidden rounded-lg border border-gray-700">
      <div className="w-full overflow-x-auto">
        <table className="w-full whitespace-nowrap">
          <thead className="bg-gray-700 text-sm font-semibold uppercase tracking-wider text-gray-300">
            <tr>
              {headers.map((header) => (
                <th key={header} className="px-6 py-3 text-left">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-gray-800 divide-y divide-gray-700 text-gray-400">
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-gray-700/50 transition-colors">
                {headers.map((header) => (
                  <td key={`${header}-${rowIndex}`} className="px-6 py-4 text-sm">
                    {row[header] === null || row[header] === '' ? <span className="text-gray-600">N/A</span> : String(row[header])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataTable;
