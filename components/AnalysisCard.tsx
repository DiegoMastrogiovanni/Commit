import React from 'react';

interface AnalysisCardProps {
  title: string;
  content: string;
}

const AnalysisCard: React.FC<AnalysisCardProps> = ({ title, content }) => {
  // Simple markdown-to-HTML parser for demonstration
  const formattedContent = content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
    .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
    .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-teal-300 px-1 rounded">$1</code>') // Inline code
    .replace(/^### (.*$)/gim, '<h3 class="text-md font-semibold text-gray-300 mt-2">$1</h3>') // H3 for pivot tables
    .replace(/\|---/g, '|:---') // Ensure table alignment
    .replace(/<br>/g, '') // remove extra breaks
    .split('\n')
    .join('<br />');

  // A more robust table parser
  const tableRegex = /<br \/>\|(.*?)<br \/>\|(.*?)<br \/>((?:\|.*?<br \/>)+)/g;
  const htmlWithTables = formattedContent.replace(tableRegex, (match, header, separator, body) => {
    const headers = header.split('|').map(h => h.trim()).filter(Boolean);
    const rows = body.split('<br />').map(r => r.split('|').map(c => c.trim()).filter(Boolean)).filter(r => r.length > 0);
    
    let table = '<table class="w-full text-left border-collapse mt-2">';
    table += '<thead><tr class="border-b border-gray-600">';
    headers.forEach(h => table += `<th class="p-2 text-sm font-semibold">${h}</th>`);
    table += '</tr></thead>';
    
    table += '<tbody>';
    rows.forEach(row => {
      table += '<tr class="border-b border-gray-700">';
      row.forEach(cell => table += `<td class="p-2 text-sm">${cell}</td>`);
      table += '</tr>';
    });
    table += '</tbody></table>';
    
    return table;
  });

  const finalHtml = htmlWithTables.split('<br />').map(line => line.trim().startsWith('<') ? line : `<p>${line}</p>`).join('');

  return (
    <div className="bg-gray-900/50 border border-indigo-500/50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-indigo-300 mb-3">{title}</h3>
      <div 
        className="prose prose-invert prose-sm text-gray-300 max-w-none space-y-2"
        dangerouslySetInnerHTML={{ __html: finalHtml }}
      />
    </div>
  );
};

export default AnalysisCard;