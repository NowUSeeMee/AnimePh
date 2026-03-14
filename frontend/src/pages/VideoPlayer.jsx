import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { animeAPI, backendAPI, watchAPI } from '../api/api';
import { FiArrowLeft, FiPlay, FiList, FiClock, FiMaximize, FiExternalLink, FiSettings, FiMic, FiType } from 'react-icons/fi';
import CommentsSection from '../components/CommentsSection';

function VideoPlayer() {
  const { id, ep } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLogged, setHistoryLogged] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  
  // Server switching states
  const [servers, setServers] = useState({ sub: [], dub: [] });
  const [selectedType, setSelectedType] = useState('sub'); // 'sub' or 'dub'
  const [selectedServer, setSelectedServer] = useState(null);
  const [iframeUrl, setIframeUrl] = useState(null);
  const [playerLoading, setPlayerLoading] = useState(false);
  const [serverLabels, setServerLabels] = useState({ sub: '3', dub: 'D', raw: 'R' });

  // The episode passed from AnimeDetails state, if available
  const currentEpisodeData = location.state?.episodeData || episodes.find(e => e.episode_number === parseInt(ep));

  // 1. Initial Data Fetch
  useEffect(() => {
    const fetchEpisodes = async (title, animeId) => {
      try {
        const res = await backendAPI.get(`/episodes/${animeId}?title=${encodeURIComponent(title)}`);
        setEpisodes(res.data);
      } catch (error) {
        console.error("Episode fetch error:", error);
      }
    };

    const fetchAnimeData = async () => {
      setLoading(true);
      try {
        const res = await animeAPI.getAnimeDetails(id);
        const data = res.data.data;
        setAnime(data);
        fetchEpisodes(data.title, id);
      } catch (err) {
        console.error('Video player fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnimeData();
    setHistoryLogged(false);
  }, [id]);

  const handleServerChange = useCallback(async (server) => {
    setSelectedServer(server);
    setPlayerLoading(true);
    
    // If it's a custom iframe server (like VidSrc), just set the link directly
    if (server.custom && server.type === 'iframe') {
       setIframeUrl(server.link);
       return;
    }

    // Otherwise, it's a scraped server that needs its source fetched
    try {
      const res = await watchAPI.getSource(server.id);
      if (res.data && res.data.link) {
        setIframeUrl(res.data.link);
      } else {
        setIframeUrl(null);
      }
    } catch (err) {
      console.error('Source fetch error:', err);
      setIframeUrl(null);
    } finally {
      // The iframe onLoad event will setPlayerLoading(false) for custom links,
      // but for direct fetches we might need to handle it differently if it's not an iframe.
      // Assuming watchAPI.getSource also returns an iframe link.
      if (!server.custom) {
         setPlayerLoading(false); 
      }
    }
  }, []);

  const fetchServers = useCallback(async (episodeId) => {
    setPlayerLoading(true);
    setIframeUrl(null);
    try {
      // Pass the anime MAL ID and Episode number to the backend
      const res = await watchAPI.getServers(episodeId, id, ep);
      const serverData = res.data;
      setServers(serverData);
      
      if (serverData.sub && serverData.sub.length > 0) {
        setSelectedType('sub');
        await handleServerChange(serverData.sub[0]);
      } else if (serverData.dub && serverData.dub.length > 0) {
        setSelectedType('dub');
        await handleServerChange(serverData.dub[0]);
      } else {
        setPlayerLoading(false);
      }
    } catch (err) {
      console.error('Server fetch error:', err);
      setPlayerLoading(false);
    }
  }, [handleServerChange, id, ep]);

  const logHistory = useCallback(async () => {
    if (!anime) return;
    try {
      await backendAPI.post('/history', {
        anime_id: anime.mal_id,
        episode_number: parseInt(ep),
        title: anime.title,
        title_english: anime.title_english,
        image_url: anime.images?.jpg?.large_image_url,
        synopsis: anime.synopsis,
        type: anime.type,
        score: anime.score,
        status: anime.status
      });
      setHistoryLogged(true);
    } catch (err) {
      console.error('History log error:', err);
    }
  }, [anime, ep]);

  // 2. Server Fetching (When episode changes)
  useEffect(() => {
    if (currentEpisodeData?.data_id) {
       fetchServers(currentEpisodeData.data_id);
    }
  }, [currentEpisodeData, fetchServers]);

  // 3. History Logging
  useEffect(() => {
    if (anime && !historyLogged) {
      logHistory();
    }
  }, [anime, ep, historyLogged, logHistory]);

  if (loading) return <div className="text-center py-20 text-anime-primary animate-pulse text-2xl font-premium">Preparing media...</div>;
  if (!anime) return <div className="text-center py-20 text-anime-secondary text-2xl font-premium">Media not found</div>;

  return (
    <div className="space-y-8 pb-20 max-w-[1400px] mx-auto px-4 lg:px-8">
      {/* Header Info */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 text-white active:scale-95"
        >
          <FiArrowLeft className="text-xl" />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{anime.title}</h1>
          <p className="text-anime-muted text-sm font-medium">Episode {ep}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Player Area */}
        <div className="lg:col-span-3 space-y-6">
          <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-white/10 group bg-neutral-900">
            {iframeUrl ? (
              <iframe 
                src={iframeUrl} 
                className={`w-full h-full transition-opacity duration-500 ${playerLoading ? 'opacity-0' : 'opacity-100'}`}
                allowFullScreen
                frameBorder="0"
                scrolling="no"
                onLoad={() => setPlayerLoading(false)}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black/60 backdrop-blur-3xl">
                <FiPlay className="text-6xl text-anime-primary mb-4 animate-pulse" />
                <h2 className="text-xl font-bold mb-2">No player source available</h2>
                <p className="text-anime-muted text-sm max-w-sm">Please try switching to another server or checking back later.</p>
              </div>
            )}

            {/* Troubleshooting Overlay for 3rd Party Errors */}
            {iframeUrl && !playerLoading && (
              <div className="absolute bottom-4 right-4 z-30 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-xl text-[10px] font-medium border border-white/10 text-white/70 flex items-center gap-2">
                   <FiSettings className="animate-spin-slow" /> Seeing "We're Sorry"? Try switching to <b>Mirror 2</b> or <b>High Speed</b> below.
                </div>
              </div>
            )}

            {playerLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-md z-20">
                <div className="relative">
                   <div className="w-16 h-16 border-4 border-anime-primary/20 border-t-anime-primary rounded-full animate-spin"></div>
                   <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-anime-primary tracking-widest uppercase">LX</div>
                </div>
              </div>
            )}
            {/* Status Overlay Removed as per user request */}
          </div>

          {/* Server Switcher UI (Inspired by User Screenshot) */}
          <div className="glass-card p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-6 justify-between select-none">
              <div className="flex flex-col gap-2 w-full">
                {/* SUB Servers */}
                {servers.sub.length > 0 && (
                  <div className="flex items-center gap-4 py-2">
                    <span className="flex items-center gap-2 text-[11px] font-black text-white/80 uppercase tracking-tighter min-w-[70px]">
                      <FiType className="text-yellow-500 text-sm" /> SUB:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {servers.sub.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedType('sub'); handleServerChange(s); }}
                          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all border ${selectedServer?.id === s.id ? 'bg-[#FFCC4D] border-[#FFCC4D] text-black shadow-[0_0_20px_rgba(255,204,77,0.3)]' : 'bg-[#2a2a2a] border-white/5 text-white/60 hover:bg-[#333] hover:text-white'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {servers.sub.length > 0 && servers.dub.length > 0 && (
                   <div className="border-t border-dashed border-white/10 my-1"></div>
                )}
                
                {/* DUB Servers */}
                {servers.dub.length > 0 && (
                  <div className="flex items-center gap-4 py-2">
                    <span className="flex items-center gap-2 text-[11px] font-black text-white/80 uppercase tracking-tighter min-w-[70px]">
                      <FiMic className="text-orange-500 text-sm" /> DUB:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {servers.dub.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedType('dub'); handleServerChange(s); }}
                          className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all border ${selectedServer?.id === s.id ? 'bg-[#FFCC4D] border-[#FFCC4D] text-black shadow-[0_0_20px_rgba(255,204,77,0.3)]' : 'bg-[#2a2a2a] border-white/5 text-white/60 hover:bg-[#333] hover:text-white'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* B: Backup Mirrors - Only show if extra exists */}
                {servers.extra && servers.extra.length > 0 && (
                  <>
                    <div className="border-t border-dashed border-white/10 my-1"></div>
                    <div className="flex items-center gap-4 py-2">
                      <span className="flex items-center gap-2 text-[11px] font-black text-white/80 uppercase tracking-tighter min-w-[70px]">
                        <FiMaximize className="text-blue-500 text-sm" /> BKP:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {servers.extra.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => { setSelectedType('extra'); handleServerChange(s); }}
                            className={`px-5 py-2.5 rounded-lg text-xs font-bold transition-all border ${selectedServer?.id === s.id ? 'bg-[#FFCC4D] border-[#FFCC4D] text-black shadow-[0_0_20px_rgba(255,204,77,0.3)]' : 'bg-[#2a2a2a] border-white/5 text-white/60 hover:bg-[#333] hover:text-white'}`}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
                
                {/* Deployment Sync Check Hint */}
                <div className="text-[9px] text-white/20 mt-2 flex justify-between items-center tabular-nums">
                  <span>API v1.2.0 • If mirrors are missing, please hard-refresh (Ctrl+F5)</span>
                </div>
              </div>

             <div className="flex gap-2 shrink-0 self-end sm:self-center">
                <Link 
                  to={`/watch/${id}/${Math.max(1, parseInt(ep) - 1)}`}
                  className="bg-white/5 hover:bg-white/10 px-5 py-2.5 rounded-xl text-xs font-bold transition-all border border-white/5 hover:border-white/10 active:scale-95"
                >
                  Prev
                </Link>
                <Link 
                  to={`/watch/${id}/${parseInt(ep) + 1}`}
                  className="btn-primary px-5 py-2.5 rounded-xl text-xs font-bold active:scale-95"
                >
                  Next
                </Link>
             </div>
          </div>

          {/* Embedded Comments */}
          <CommentsSection animeId={id} animeData={anime} />
        </div>

        {/* Sidebar Info & Recommendations */}
        <div className="space-y-6">
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">
              <FiList className="text-anime-secondary" /> Episode List
            </h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {episodes.length > 0 ? episodes.map((episode) => (
                <Link 
                  key={episode.episode_number}
                  to={`/watch/${id}/${episode.episode_number}`}
                  state={{ episodeData: episode }}
                  className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${parseInt(ep) === episode.episode_number ? 'bg-anime-primary/20 border-anime-primary text-anime-primary shadow-[0_0_15px_rgba(99,102,241,0.15)]' : 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-anime-muted'}`}
                >
                  <span className="text-[10px] font-black w-6 text-center opacity-60">
                    {episode.episode_number.toString().padStart(2, '0')}
                  </span>
                  <span className="text-xs font-bold truncate flex-1">{episode.title || `Episode ${episode.episode_number}`}</span>
                  {parseInt(ep) === episode.episode_number && <div className="w-1.5 h-1.5 rounded-full bg-anime-primary animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.8)]"></div>}
                </Link>
              )) : (
                <div className="space-y-2">
                   {[1,2,3,4,5].map(i => (
                     <div key={i} className="h-12 bg-white/5 rounded-2xl animate-pulse"></div>
                   ))}
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6 group cursor-pointer hover:border-anime-primary/30 transition-all">
             <div className="relative overflow-hidden rounded-2xl mb-4 aspect-[2/3]">
                <img 
                  src={anime.images?.jpg?.large_image_url} 
                  alt={anime.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4">
                   <div className="text-[10px] font-bold text-anime-primary uppercase mb-1">{anime.type}</div>
                   <h4 className="font-bold text-xs line-clamp-1">{anime.title}</h4>
                </div>
             </div>
             <p className="text-[11px] text-anime-muted line-clamp-4 leading-relaxed opacity-80">{anime.synopsis?.replace(/\[Written by MAL Rewrite\]/g, "").trim()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
