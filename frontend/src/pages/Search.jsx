import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { animeAPI } from '../api/api';
import AnimeCard from '../components/AnimeCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';

function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q');
  
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchSearch = async () => {
      if (!query) return;
      setLoading(true);
      try {
        const res = await animeAPI.searchAnime(query);
        setResults(res.data.data);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSearch();
  }, [query]);

  return (
    <div className="space-y-6 pb-10">
      <div className="glass-card p-6 border-b border-anime-primary/20">
        <h1 className="text-3xl font-bold">
          Search Results for <span className="text-anime-primary">"{query}"</span>
        </h1>
        <p className="text-anime-muted mt-2">Found {results.length} matches in the database.</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {loading ? (
          <LoadingSkeleton count={10} />
        ) : results.length > 0 ? (
          results.map(anime => (
            <AnimeCard key={anime.mal_id} anime={anime} />
          ))
        ) : (
          !loading && <p className="text-anime-muted col-span-full">No results found for your query.</p>
        )}
      </div>
    </div>
  );
}

export default Search;
