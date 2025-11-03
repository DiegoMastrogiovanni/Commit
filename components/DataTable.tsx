
import React from 'react';
import { type DataRow } from '../types';
import { ArrowUpIcon, ArrowDownIcon, SortUpDownIcon, HistoryIcon } from './Icons';

interface DataTableProps {
  headers: string[];
  data: DataRow[];
  sortConfig: { key: string; direction: 'ascending' | 'descending' } | null;
  requestSort: (key: string) => void;
  filterText: string;
  onFilterChange: (value: string) => void;
  onFilterSubmit: (value: string) => void;
  searchHistory: string[];
}

const DataTable: React.FC<DataTableProps> = ({ headers, data, sortConfig, requestSort, filterText, onFilterChange, onFilterSubmit, searchHistory }) => {
  const hasOriginalData = data.length > 0 || filterText;

  if (!hasOriginalData) {
    return <p className="text-center text-gray-500">No data to display.</p>;
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onFilterSubmit(filterText);
      event.currentTarget.blur();
    }
  };

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Filter data..."
          value={filterText}
          onChange={(e) => onFilterChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onFilterSubmit(filterText)}
          className="w-full md:w-1/2 lg:w-1/3 p-2 bg-gray-700/50 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
        />
        {searchHistory.length > 0 && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-400 font-semibold flex items-center shrink-0">
              <HistoryIcon className="w-4 h-4 mr-1.5 text-gray-500" />
              RECENT:
            </span>
            {searchHistory.map((query, index) => (
              <button
                key={`${query}-${index}`}
                onClick={() => onFilterChange(query)}
                title={`Apply filter: "${query}"`}
                className="text-xs bg-gray-700/80 hover:bg-gray-600 text-gray-300 px-2.5 py-1 rounded-full transition-colors"
              >
                {query}
              </button>
            ))}
          </div>
        )}
      </div>
      {data.length === 0 && filterText !== '' ? (
         <p className="text-center text-gray-500 py-4">No records match your filter.</p>
      ) : (
        <div className="w-full overflow-hidden rounded-lg border border-gray-700">
          <div className="w-full overflow-x-auto">
            <table className="w-full whitespace-nowrap">
              <thead className="bg-gray-700 text-sm font-semibold uppercase tracking-wider text-gray-300">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="px-6 py-3 text-left">
                      <button
                        type="button"
                        onClick={() => requestSort(header)}
                        className="flex items-center gap-2 hover:text-teal-300 transition-colors"
                        aria-label={`Sort by ${header}`}
                      >
                        {header}
                        {sortConfig?.key === header ? (
                          sortConfig.direction === 'ascending' ? (
                            <ArrowUpIcon className="w-4 h-4 text-teal-400" />
                          ) : (
                            <ArrowDownIcon className="w-4 h-4 text-teal-400" />
                          )
                        ) : (
                          <SortUpDownIcon className="w-4 h-4 text-gray-500" />
                        )}
                      </button>
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
      )}
    </div>
  );
};

export default DataTable;
