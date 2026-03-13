import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { animeAPI, backendAPI, fetchAnimeRelations } from '../api/api';
import { FiHeart, FiPlayCircle, FiInfo, FiCheck, FiPlay, FiList, FiChevronDown } from 'react-icons/fi';
import CommentsSection from '../components/CommentsSection';

function AnimeDetails() {
  const { id } = useParams();
  const [anime, setAnime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favLoading, setFavLoading] = useState(false);
  const [episodes, setEpisodes] = useState([]);
  const [epsLoading, setEpsLoading] = useState(false);
  const [relatedAnime, setRelatedAnime] = useState([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const getHeroImage = (animeData) => {
    // Extract YouTube video ID from any available source
    let ytId = animeData.trailer?.youtube_id;
    if (!ytId && animeData.trailer?.url) {
      const vid = animeData.trailer.url.split('v=')[1]?.split('&')[0];
      if (vid) ytId = vid;
    }
    if (!ytId && animeData.trailer?.embed_url) {
      const match = animeData.trailer.embed_url.match(/embed\/([^?]+)/);
      if (match && match[1]) ytId = match[1];
    }

    // Priority: Jikan maximum_image_url (highest from API) → YouTube maxresdefault (1080p)
    if (animeData.trailer?.images?.maximum_image_url) {
      return animeData.trailer.images.maximum_image_url;
    }
    if (ytId) {
      return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    }
    // Fallback to highest quality poster image  
    return animeData.images?.webp?.large_image_url || animeData.images?.jpg?.large_image_url;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      try {
        const res = await animeAPI.getAnimeDetails(id);
        const data = res.data.data;
        setAnime(data);
        fetchRealEpisodes(data.title, data.title_english, id);

        // Fetch Franchise Relations (Seasons/Movies)
        try {
          const relRes = await fetchAnimeRelations(id);
          const relationData = relRes.data.data;
          
          let related = [];
          relationData.forEach(rel => {
            if (['Sequel', 'Prequel', 'Alternative version'].includes(rel.relation)) {
              rel.entry.forEach(entry => {
                 if (entry.type === 'anime') {
                    related.push({ ...entry, relationType: rel.relation });
                 }
              });
            }
          });
          setRelatedAnime(related);
        } catch (rErr) {
          console.error("Relations error:", rErr);
        }

      } catch (error) {
        console.error("Details error:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRealEpisodes = async (title, titleEnglish, animeId) => {
      setEpsLoading(true);
      try {
        const res = await backendAPI.get(`/episodes/${animeId}?title=${encodeURIComponent(title)}&titleEnglish=${encodeURIComponent(titleEnglish || '')}`);
        setEpisodes(res.data);
      } catch (error) {
        console.error("Episode fetch error:", error);
      } finally {
        setEpsLoading(false);
      }
    };

    const checkFavorite = async () => {
      try {
        const res = await backendAPI.get(`/favorites/check/${id}`);
        setIsFavorite(res.data.isFavorite);
      } catch (error) {
        console.error("Favorite check error:", error);
      }
    };

    fetchDetails();
    checkFavorite();
  }, [id]);

  const toggleFavorite = async () => {
    if (!anime || favLoading) return;
    setFavLoading(true);
    try {
      if (isFavorite) {
        await backendAPI.delete(`/favorites/${id}`);
        setIsFavorite(false);
      } else {
        await backendAPI.post('/favorites', {
          anime_id: anime.mal_id,
          title: anime.title,
          title_english: anime.title_english,
          image_url: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url,
          synopsis: anime.synopsis,
          type: anime.type,
          score: anime.score,
          status: anime.status
        });
        setIsFavorite(true);
      }
    } catch (error) {
      console.error("Toggle favorite error:", error);
      alert("Failed to update watchlist. Is the backend running?");
    } finally {
      setFavLoading(false);
    }
  };

  if (loading) return <div className="text-center py-32 animate-pulse text-anime-primary text-2xl">Loading anime details...</div>;
  if (!anime) return <div className="text-center py-32 text-anime-secondary text-2xl">Anime not found</div>;

  return (
    <div className="pb-20 min-h-screen">
      {/* Full-Bleed Hero Banner */}
      <div className="w-full relative -mt-20 z-0 h-[60vh] md:h-[75vh] lg:h-[85vh]">
         {/* Background Image */}
         <div 
           className="absolute inset-0 w-full h-full bg-cover bg-center object-cover"
           style={{ backgroundImage: `url(${getHeroImage(anime)})`}}
         ></div>

         {/* Crunchyroll Cinematic Gradients */}
         <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-[#030712]/60 to-transparent z-10 w-full md:w-2/3"></div>
         {/* Gradient that only covers the bottom portion */}
         <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#030712] via-[#030712]/80 to-transparent z-10"></div>
         
         {/* Hero Content (Poster, Title, Buttons) positioned at Bottom-Left */}
         <div className="absolute bottom-0 left-0 w-full z-20 px-4 sm:px-8 md:px-16 lg:px-24 pb-12 flex flex-col md:flex-row gap-8 items-end">
            {/* Poster - Hide on mobile if preferred, or keep small */}
            <div className="shrink-0 hidden md:block">
               <img 
                 src={anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url} 
                 alt={anime.title} 
                 className="w-48 md:w-56 lg:w-[260px] rounded-sm shadow-[0_10px_40px_rgba(0,0,0,0.8)] border border-white/5 object-cover"
                 style={{ imageRendering: 'high-quality' }}
               />
            </div>
            
            {/* Title & Actions */}
            <div className="flex-1 space-y-4 w-full">
               <h1 className="text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-black leading-tight text-white drop-shadow-lg max-w-4xl">{anime.title}</h1>
               <p className="text-gray-300 text-sm md:text-base font-medium drop-shadow-md flex flex-wrap items-center gap-2">
                 {anime.rating && <span className="bg-white/10 px-2 py-0.5 rounded text-xs font-bold text-white border border-white/20">{anime.rating.split(' ')[0]}</span>}
                 <span>{anime.title_english ? `${anime.title_english} • ` : ''}</span>
                 <span>{anime.type}</span>
                 <span>•</span>
                 <span>{anime.year || (anime.aired?.prop?.from?.year) || 'N/A'}</span>
               </p>
               
               <div className="flex flex-wrap gap-x-2 gap-y-1 mt-3">
                  {anime.genres?.map(g => (
                    <span key={g.mal_id} className="text-gray-400 hover:text-anime-primary transition-colors cursor-pointer text-sm font-medium">
                      {g.name}
                      <span className="text-gray-600 ml-2 last:hidden">,</span>
                    </span>
                  ))}
               </div>

               <div className="flex flex-wrap gap-4 pt-4">
                 <Link 
                    to={`/watch/${anime.mal_id}/1`}
                    className="bg-anime-primary text-black font-extrabold py-3 px-8 rounded hover:bg-anime-accent transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-sm shadow-[0_4px_14px_0_rgba(255,107,107,0.39)] hover:shadow-[0_6px_20px_rgba(255,107,107,0.23)] transform hover:-translate-y-0.5 duration-200"
                 >
                   <FiPlay className="text-xl fill-current" /> Watch now
                 </Link>
                 <button 
                    onClick={toggleFavorite}
                    disabled={favLoading}
                    className={`font-extrabold py-3 px-6 rounded transition-all duration-300 flex items-center justify-center gap-2 border-2 disabled:opacity-50 uppercase tracking-wider text-sm outline-none ${isFavorite ? 'bg-white/10 text-white border-transparent' : 'bg-transparent text-anime-primary border-anime-primary hover:bg-anime-primary/10'}`}
                 >
                   {isFavorite ? <><FiCheck className="text-xl" /> Added</> : <><FiHeart className="text-xl" /> Add to Watchlist</>}
                 </button>
               </div>
            </div>
         </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-8 md:px-16 lg:px-24 pt-12 space-y-16">
        
        {/* Top Info & Synopsis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Synopsis (Wider column) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">About the Show</h2>
            <p className="text-gray-300 leading-loose whitespace-pre-line text-sm md:text-base">
              {anime.synopsis?.replace(/\[Written by MAL Rewrite\]/g, '').trim() || "No synopsis available."}
            </p>
          </div>

          {/* Quick Info (Narrower column) */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold mb-6 text-white border-b border-white/10 pb-4">Details</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-8 text-sm">
              <div className="flex flex-col">
                <span className="text-gray-500 font-semibold mb-1">Score</span>
                <span className="text-white font-medium flex items-center gap-1">
                  <span className="text-amber-400 font-bold">{anime.score || 'N/A'}</span> 
                  {anime.scored_by && <span className="text-gray-500 text-xs">({anime.scored_by.toLocaleString()} ratings)</span>}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 font-semibold mb-1">Episodes</span>
                <span className="text-white font-medium">{anime.episodes || 'Unknown'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 font-semibold mb-1">Status</span>
                <span className="text-white font-medium">{anime.status}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 font-semibold mb-1">Studios</span>
                <span className="text-white font-medium">{anime.studios?.map(s => s.name).join(', ') || 'Unknown'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-gray-500 font-semibold mb-1">Rank</span>
                <span className="text-white font-medium">#{anime.rank || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Episodes Section - Full Width */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">Episodes</h2>

            {/* Franchise / Seasons Dropdown */}
            {relatedAnime.length > 0 && (
              <div ref={dropdownRef} className="relative w-full sm:w-80 z-30">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="flex justify-between items-center w-full bg-[#1A1C20] border border-white/10 hover:border-white/30 px-5 py-3.5 text-sm font-semibold transition-colors focus:outline-none rounded-sm"
                >
                  <span className="truncate pr-4 text-white">Season: <span className="text-gray-400 font-normal">{anime.title}</span></span>
                  <FiChevronDown className={`shrink-0 text-anime-muted transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {isDropdownOpen && (
                  <div className="absolute top-[calc(100%+4px)] right-0 w-full lg:w-[400px] max-h-[400px] overflow-y-auto bg-[#131418] border border-white/10 shadow-2xl z-50 flex flex-col mt-0 animate-fade-in custom-scrollbar rounded-sm shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                     
                     {/* Current Season Indicator */}
                     <div className="px-5 py-4 border-l-4 border-anime-primary bg-[#1A1C20] flex flex-col cursor-default">
                        <span className="text-anime-primary text-[10px] font-black uppercase tracking-wider mb-1">Current Selection</span>
                        <span className="text-sm font-bold text-white line-clamp-2 leading-tight">{anime.title}</span>
                     </div>

                     {/* Related List */}
                     <div className="py-2">
                       {relatedAnime.map(rel => (
                         <Link 
                           key={rel.mal_id}
                           to={`/anime/${rel.mal_id}`}
                           onClick={() => setIsDropdownOpen(false)}
                           className="group block px-5 py-3.5 hover:bg-white/5 border-l-4 border-transparent hover:border-white/30 transition-all cursor-pointer"
                         >
                            <div className="flex flex-col">
                              <span className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-1">
                                {rel.relationType}
                              </span>
                              <span className="text-sm text-gray-300 font-medium group-hover:text-white line-clamp-2 leading-tight transition-colors">
                                {rel.name}
                              </span>
                            </div>
                         </Link>
                       ))}
                     </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 relative z-20">
            {epsLoading ? (
              <div className="col-span-full py-16 text-center text-anime-muted flex flex-col items-center">
                <div className="w-10 h-10 rounded-full border-4 border-anime-primary/20 border-t-anime-primary animate-spin mb-4"></div>
                Loading episodes securely...
              </div>
            ) : episodes.length > 0 ? (
              episodes.map((ep) => (
                <Link 
                  key={ep.episode_number}
                  to={`/watch/${anime.mal_id}/${ep.episode_number}`}
                  state={{ episodeData: ep }}
                  className="flex flex-col gap-3 p-4 rounded bg-[#1A1C20] border border-transparent hover:bg-[#23262b] hover:border-anime-primary/30 transition-all group overflow-hidden relative"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded bg-black/40 flex items-center justify-center shrink-0 border border-white/5 group-hover:text-anime-primary transition-colors">
                      <span className="text-base font-bold text-gray-300 group-hover:text-white">{ep.episode_number}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-200 group-hover:text-white truncate" title={ep.title || `Episode ${ep.episode_number}`}>
                        {ep.title || `Episode ${ep.episode_number}`}
                      </p>
                      <p className="text-[11px] text-anime-primary mt-1 font-medium">Sub | Dub</p>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full py-16 text-center text-gray-500 bg-[#1A1C20]/50 rounded border border-white/5">
                <p className="text-lg mb-2">No episodes streaming yet.</p>
                <p className="text-sm text-gray-600">This anime might be unaired or unavailable.</p>
              </div>
            )}
          </div>
        </section>

        {/* Comments Section - Full Width */}
        <section className="pt-8 border-t border-white/10">
           <CommentsSection animeId={id} animeData={anime} />
        </section>
      </div>
    </div>
  );
}

export default AnimeDetails;
