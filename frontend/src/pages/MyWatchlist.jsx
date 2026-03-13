import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { backendAPI } from '../api/api';
import { FiHeart, FiClock, FiVideo, FiTrash2 } from 'react-icons/fi';

function MyWatchlist() {
  const [favorites, setFavorites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('watchlist'); // 'watchlist' or 'history'

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [favRes, histRes] = await Promise.all([
        backendAPI.get('/favorites'),
        backendAPI.get('/history')
      ]);
      setFavorites(favRes.data);
      setHistory(histRes.data);
    } catch (error) {
        console.error("Data fetch error:", error);
    } finally {
        setLoading(false);
    }
  };

  const removeFavorite = async (animeId) => {
    try {
      await backendAPI.delete(`/favorites/${animeId}`);
      setFavorites(prev => prev.filter(fav => fav.anime_id !== animeId));
    } catch (error) {
      console.error("Remove favorite error:", error);
      alert("Failed to remove item.");
    }
  };

  return (
    <div className="space-y-8 pb-10 max-w-5xl mx-auto">
      <div className="glass-card p-10 text-center bg-gradient-to-br from-anime-800/80 via-anime-900/40 to-anime-bg border border-white/5">
        <h1 className="text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-anime-primary via-anime-secondary to-anime-accent flex items-center justify-center gap-3 mb-4">
          Personal Dashboard
        </h1>
        <p className="text-anime-muted max-w-2xl mx-auto text-lg leading-relaxed">
           Manage your anime collection and track your progress across your favorite masterpieces.
        </p>

        {/* Tabs */}
        <div className="flex justify-center gap-4 mt-8">
            <button 
              onClick={() => setActiveTab('watchlist')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'watchlist' ? 'bg-anime-primary text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/5 text-anime-muted hover:bg-white/10'}`}
            >
              <FiHeart /> Watchlist ({favorites.length})
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-6 py-2 rounded-full font-bold transition-all ${activeTab === 'history' ? 'bg-anime-secondary text-white shadow-[0_0_20px_rgba(236,72,153,0.4)]' : 'bg-white/5 text-anime-muted hover:bg-white/10'}`}
            >
              <FiClock /> Watch History ({history.length})
            </button>
        </div>
      </div>

      <div className="glass-card p-6 md:p-8 border border-white/5 min-h-[400px]">
        {loading ? (
           <div className="flex flex-col items-center justify-center h-full py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-anime-primary/20 border-t-anime-primary rounded-full animate-spin"></div>
              <p className="text-anime-muted">Retrieving your data...</p>
           </div>
        ) : activeTab === 'watchlist' ? (
           <div className="space-y-4">
              {favorites.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <FiVideo className="text-6xl text-anime-800 mx-auto" />
                  <p className="text-anime-muted text-lg">Your watchlist is currently empty.</p>
                  <Link to="/" className="inline-block mt-4 btn-primary px-8 py-2">
                    Start Discovering
                  </Link>
                </div>
              ) : (
                favorites.map(fav => (
                  <div key={fav.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                    <Link to={`/anime/${fav.anime_id}`} className="w-16 h-24 bg-anime-800 rounded-md shrink-0 flex items-center justify-center border border-white/10 overflow-hidden">
                       <img src={fav.image_url} alt={fav.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/anime/${fav.anime_id}`} className="font-bold text-lg text-white hover:text-anime-primary transition-colors block truncate">
                        {fav.title}
                      </Link>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs font-semibold bg-anime-800 text-anime-muted px-2 py-1 rounded border border-white/5">
                          {fav.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        <span className="text-[10px] text-anime-muted/40 uppercase tracking-widest font-bold">
                          {fav.type}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeFavorite(fav.anime_id)}
                      className="text-anime-muted hover:text-anime-secondary transition-colors p-3 rounded-full hover:bg-anime-secondary/10"
                    >
                      <FiTrash2 className="text-xl" />
                    </button>
                  </div>
                ))
              )}
           </div>
        ) : (
           <div className="space-y-4">
              {history.length === 0 ? (
                <div className="text-center py-20 space-y-4">
                  <FiClock className="text-6xl text-anime-800 mx-auto" />
                  <p className="text-anime-muted text-lg">You haven't watched anything yet.</p>
                </div>
              ) : (
                history.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group">
                    <Link to={`/watch/${item.anime_id}/${item.episode_number || 1}`} className="w-16 h-16 bg-anime-800 rounded-lg shrink-0 flex items-center justify-center border border-white/10 overflow-hidden relative">
                       <img src={item.image_url} alt={item.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                       <FiPlay className="absolute text-white" />
                    </Link>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                         <Link to={`/anime/${item.anime_id}`} className="font-bold text-white hover:text-anime-secondary transition-colors truncate">
                           {item.title}
                         </Link>
                         <span className="text-[10px] text-anime-muted whitespace-nowrap bg-white/5 px-2 py-1 rounded">
                           {new Date(item.watched_at).toLocaleDateString()}
                         </span>
                      </div>
                      <p className="text-sm text-anime-primary mt-1 font-medium">Episode {item.episode_number || 1} • Watched</p>
                    </div>
                  </div>
                ))
              )}
           </div>
        )}
      </div>
    </div>
  );
}

export default MyWatchlist;
