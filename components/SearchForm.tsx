import React, { useState, useEffect } from 'react';
import { SearchIcon } from './icons/SearchIcon';

interface SearchFormProps {
  query: string;
  onSearch: (query: string) => void;
  isLoading: boolean;
}

export const SearchForm: React.FC<SearchFormProps> = ({ query, onSearch, isLoading }) => {
  const [internalQuery, setInternalQuery] = useState(query);

  useEffect(() => {
    setInternalQuery(query);
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(internalQuery);
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-md transition-shadow hover:shadow-lg">
      <form onSubmit={handleSubmit} className="flex items-center gap-2 sm:gap-4">
        <div className="relative flex-1">
          <input
            id="q"
            type="text"
            value={internalQuery}
            onChange={(e) => setInternalQuery(e.target.value)}
            placeholder="Ej: excavación para cimentación"
            className="w-full p-3 pl-4 text-base bg-slate-50 rounded-lg border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !internalQuery.trim()}
          className="px-4 sm:px-6 py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
        >
          <SearchIcon />
          <span className="hidden sm:inline">
            {isLoading ? 'Buscando...' : 'Buscar'}
          </span>
        </button>
      </form>
    </div>
  );
};