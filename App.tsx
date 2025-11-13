import React, { useState, useCallback } from 'react';
import { SearchForm } from './components/SearchForm';
import { ResultCard } from './components/ResultCard';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ErrorMessage } from './components/ErrorMessage';
import { geminiService } from './services/geminiService';
import { type SearchResult } from './types';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { InitialState } from './components/InitialState';
import { SearchHistory } from './components/SearchHistory';

const App: React.FC = () => {
  const [query, setQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  const handleSearch = useCallback(async (searchQuery: string) => {
    const trimmedQuery = searchQuery.trim();
    if (!trimmedQuery) return;
    
    setIsLoading(true);
    setError(null);
    setSearchResult(null);
    setQuery(trimmedQuery);

    try {
      const result = await geminiService.getConstructionInfo(trimmedQuery);
      setSearchResult(result);
      
      setSearchHistory(prevHistory => {
        const lowerCaseQuery = trimmedQuery.toLowerCase();
        const filteredHistory = prevHistory.filter(
          item => item.toLowerCase() !== lowerCaseQuery
        );
        const newHistory = [trimmedQuery, ...filteredHistory];
        return newHistory.slice(0, 10);
      });

    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 text-slate-900 font-sans flex flex-col">
      <main className="flex-grow p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Header />
          <div className="mt-6">
            <SearchForm 
              query={query}
              onSearch={handleSearch} 
              isLoading={isLoading} 
            />
          </div>
          <SearchHistory history={searchHistory} onHistoryClick={handleSearch} />
          <div className="mt-8">
            {isLoading && <LoadingSpinner />}
            {error && <ErrorMessage message={error} />}
            {searchResult && (
              <ResultCard 
                result={searchResult}
              />
            )}
            {!isLoading && !error && !searchResult && <InitialState />}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;