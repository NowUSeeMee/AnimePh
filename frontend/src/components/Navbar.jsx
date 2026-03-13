import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FiSearch, FiHeart, FiHome, FiLoader, FiX, FiStar } from 'react-icons/fi';
import { animeAPI } from '../api/api';

function Navbar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef(null);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Close suggestions when route changes
  useEffect(() => {
    setShowSuggestions(false);
    setSearchQuery('');
  }, [location.pathname]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced live search
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSuggestions([]);
        setIsSearching(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await animeAPI.searchAnime(searchQuery);
        setSuggestions(response.data.data.slice(0, 5)); // show top 5
        setShowSuggestions(true);
      } catch (error) {
        console.error("Live search failed", error);
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchSuggestions();
    }, 400); // 400ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${searchQuery}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-anime-900/80 backdrop-blur-lg border-b border-white/5">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo1.png" alt="AnimePh Logo" className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-300" />
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-anime-primary to-anime-secondary">
            AnimePh
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2 text-anime-text hover:text-anime-primary transition-colors">
            <FiHome /> Home
          </Link>
          <Link to="/watchlist" className="flex items-center gap-2 text-anime-text hover:text-anime-secondary transition-colors">
            <FiHeart /> Watchlist
          </Link>
        </div>

        {/* Search Bar - Changed to reference ref */}
        <div ref={searchRef} className="flex-1 max-w-sm mx-4 relative z-[60]">
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative group">
              <input
                type="text"
                placeholder="Search anime..."
                value={searchQuery}
                onFocus={() => { if(suggestions.length > 0) setShowSuggestions(true); }}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-anime-card/80 backdrop-blur-md border border-white/10 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:border-anime-primary focus:ring-1 focus:ring-anime-primary transition-all group-hover:border-white/20 shadow-lg"
              />
              <button 
                type="button" 
                onClick={handleSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-anime-muted hover:text-anime-primary transition-colors"
              >
                {isSearching ? <FiLoader className="animate-spin" /> : <FiSearch />}
              </button>
              
              {/* Clear Input Button */}
              {searchQuery && !isSearching && (
                 <button 
                  type="button" 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-9 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                >
                  <FiX size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Live Search Auto-complete Dropdown */}
          {showSuggestions && searchQuery.length >= 3 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-anime-card/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col z-[100] transform transition-all animate-fade-in divide-y divide-white/5">
              {suggestions.length > 0 ? (
                <>
                  {suggestions.map((anime) => (
                    <Link
                      key={anime.mal_id}
                      to={`/anime/${anime.mal_id}`}
                      className="flex items-center gap-3 p-3 hover:bg-white/10 transition-colors group"
                      onClick={() => setShowSuggestions(false)}
                    >
                      <img 
                        src={anime.images?.webp?.image_url || anime.images?.jpg?.image_url || anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url} 
                        alt={anime.title} 
                        className="w-10 h-14 object-cover rounded shadow group-hover:shadow-anime-primary/20 transition-all border border-transparent group-hover:border-anime-primary/30"
                        loading="lazy"
                        style={{ imageRendering: 'high-quality' }}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-semibold truncate group-hover:text-anime-primary transition-colors">
                          {anime.title_english || anime.title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-anime-muted mt-1">
                          {anime.year && <span>{anime.year}</span>}
                          {anime.year && <span className="w-1 h-1 rounded-full bg-white/20"></span>}
                          <span className="flex items-center gap-1 text-anime-secondary"><FiStar className="fill-current w-3 h-3"/> {anime.score || 'N/A'}</span>
                          {anime.type && <span className="w-1 h-1 rounded-full bg-white/20"></span>}
                          {anime.type && <span className="uppercase text-[10px] tracking-wider">{anime.type}</span>}
                        </div>
                      </div>
                    </Link>
                  ))}
                  <div 
                    onClick={handleSearch}
                    className="p-3 text-center text-xs font-semibold text-anime-primary hover:bg-anime-primary hover:text-white cursor-pointer transition-colors uppercase tracking-wider"
                  >
                    View All Results
                  </div>
                </>
              ) : (
                <div className="p-4 text-center text-sm text-anime-muted">
                  No anime found matching "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </nav>
  );
}

export default Navbar;
