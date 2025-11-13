import React from 'react';
import { ClockIcon } from './icons/ClockIcon';

interface SearchHistoryProps {
  history: string[];
  onHistoryClick: (query: string) => void;
}

export const SearchHistory: React.FC<SearchHistoryProps> = ({ history, onHistoryClick }) => {
  if (history.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 px-1">
      <h3 className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2">
        <ClockIcon />
        Búsquedas Recientes
      </h3>
      <div className="flex flex-wrap gap-2">
        {history.map((item) => (
          <button
            key={item}
            onClick={() => onHistoryClick(item)}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-700 rounded-full hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-400 transition-colors"
            title={`Buscar de nuevo: ${item}`}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};