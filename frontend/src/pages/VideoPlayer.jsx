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
    try {
      const res = await watchAPI.getSource(server.id);
      if (res.data && res.data.link) {
        setIframeUrl(res.data.link);
      } else {
        setIframeUrl(null);
      }
      // Trigger Vercel redeploy with valid author
    } catch (err) {
      console.error('Source fetch error:', err);
      setIframeUrl(null);
    } finally {
      setPlayerLoading(false);
    }
  }, []);

  const fetchServers = useCallback(async (episodeId) => {
    setPlayerLoading(true);
    setIframeUrl(null);
    try {
      const res = await watchAPI.getServers(episodeId);
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
  }, [handleServerChange]);

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
                referrerPolicy="no-referrer"
                sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
                onLoad={() => setPlayerLoading(false)}
              ></iframe>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black/60 backdrop-blur-3xl">
                <FiPlay className="text-6xl text-anime-primary mb-4 animate-pulse" />
                <h2 className="text-xl font-bold mb-2">No player source available</h2>
                <p className="text-anime-muted text-sm max-w-sm">Please try switching to another server or checking back later.</p>
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
            
            {/* Status Overlay */}
            <div className="absolute top-6 left-6 z-30 flex gap-2">
              <div className="bg-black/40 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-bold border border-white/10 text-white uppercase tracking-wider">
                {selectedServer?.custom ? selectedServer.name : (selectedServer?.name || 'Loading Server...')}
              </div>
              <div className="bg-anime-primary/20 backdrop-blur-xl px-3 py-1.5 rounded-xl text-[10px] font-bold border border-anime-primary/20 text-anime-primary uppercase tracking-wider">
                {selectedType}
              </div>
            </div>
          </div>

          {/* Server Switcher UI (Inspired by User Screenshot) */}
          <div className="glass-card p-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-6 justify-between select-none">
              <div className="flex flex-col gap-4 w-full">
                {/* SUB Servers (PRIORITY) */}
                {servers.sub.length > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-anime-muted uppercase tracking-widest min-w-[45px]">
                      <FiType className="text-anime-secondary" /> SUB:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {servers.sub.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedType('sub'); handleServerChange(s); }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedServer?.id === s.id && !selectedServer?.custom ? 'bg-anime-primary/20 border-anime-primary text-anime-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-anime-muted hover:bg-white/10 hover:text-white'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* DUB Servers (PRIORITY) */}
                {servers.dub.length > 0 && (
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1.5 text-[10px] font-black text-anime-muted uppercase tracking-widest min-w-[45px]">
                      <FiMic className="text-anime-secondary" /> DUB:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {servers.dub.map((s) => (
                        <button
                          key={s.id}
                          onClick={() => { setSelectedType('dub'); handleServerChange(s); }}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedServer?.id === s.id && !selectedServer?.custom ? 'bg-anime-primary/20 border-anime-primary text-anime-primary shadow-[0_0_15px_rgba(99,102,241,0.2)]' : 'bg-white/5 border-white/5 text-anime-muted hover:bg-white/10 hover:text-white'}`}
                        >
                          {s.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Stable / Fallback Sources */}
                <div className="flex items-center gap-4 border-t border-white/5 pt-4 mt-2">
                  <span className="flex items-center gap-1.5 text-[10px] font-black text-anime-primary uppercase tracking-widest min-w-[55px]">
                    <FiSettings className="animate-spin-slow" /> STABLE:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        setSelectedType('mix');
                        const s = { id: 'vidsrc-to', name: 'Vidsrc.to ⚡', custom: true, link: `https://vidsrc.to/embed/anime/${id}/${ep}` };
                        setSelectedServer(s);
                        setIframeUrl(s.link);
                        setPlayerLoading(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedServer?.id === 'vidsrc-to' ? 'bg-anime-primary/20 border-anime-primary text-anime-primary' : 'bg-white/5 border-white/5 text-anime-muted hover:bg-white/10 hover:text-white'}`}
                    >
                      Vidsrc.to
                    </button>
                    <button
                      onClick={() => {
                        setSelectedType('mix');
                        const s = { id: 'vidsrc-me', name: 'Vidsrc.me 💎', custom: true, link: `https://vidsrc.me/embed/anime/${id}/${ep}` };
                        setSelectedServer(s);
                        setIframeUrl(s.link);
                        setPlayerLoading(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedServer?.id === 'vidsrc-me' ? 'bg-anime-primary/20 border-anime-primary text-anime-primary' : 'bg-white/5 border-white/5 text-anime-muted hover:bg-white/10 hover:text-white'}`}
                    >
                      Vidsrc.me
                    </button>
                    <button
                      onClick={() => {
                        setSelectedType('mix');
                        const s = { id: 'vidsrc-cc', name: 'Vidsrc.cc 🔥', custom: true, link: `https://vidsrc.cc/v2/embed/anime/${id}/${ep}/sub` };
                        setSelectedServer(s);
                        setIframeUrl(s.link);
                        setPlayerLoading(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedServer?.id === 'vidsrc-cc' ? 'bg-anime-primary/20 border-anime-primary text-anime-primary' : 'bg-white/5 border-white/5 text-anime-muted hover:bg-white/10 hover:text-white'}`}
                    >
                      Vidsrc.cc
                    </button>
                    <button
                      onClick={() => {
                        setSelectedType('mix');
                        const s = { id: 'megacloud', name: 'MegaCloud ☁️', custom: true, link: `https://vidsrc.xyz/embed/anime/${id}/${ep}` };
                        setSelectedServer(s);
                        setIframeUrl(s.link);
                        setPlayerLoading(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedServer?.id === 'megacloud' ? 'bg-anime-primary/20 border-anime-primary text-anime-primary' : 'bg-white/5 border-white/5 text-anime-muted hover:bg-white/10 hover:text-white'}`}
                    >
                      MegaCloud
                    </button>
                    <button
                      onClick={() => {
                        setSelectedType('mix');
                        const s = { id: 't-cloud', name: 'T-Cloud ⚡', custom: true, link: `https://vidsrc.icu/embed/anime/${id}/${ep}` };
                        setSelectedServer(s);
                        setIframeUrl(s.link);
                        setPlayerLoading(true);
                      }}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${selectedServer?.id === 't-cloud' ? 'bg-anime-primary/20 border-anime-primary text-anime-primary' : 'bg-white/5 border-white/5 text-anime-muted hover:bg-white/10 hover:text-white'}`}
                    >
                      T-Cloud
                    </button>
                    <button
                      onClick={() => window.open(iframeUrl, '_blank')}
                      className="px-4 py-2 rounded-xl text-xs font-bold transition-all border bg-anime-secondary/10 border-anime-secondary text-anime-secondary hover:bg-anime-secondary/20"
                      title="Open in new tab if video doesn't load"
                    >
                      <FiExternalLink className="inline mr-1" /> Mirror Link
                    </button>
                  </div>
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
