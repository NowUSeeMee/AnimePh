import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { animeAPI } from '../api/api';
import AnimeCard from '../components/AnimeCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { Link } from 'react-router-dom';
import { FiStar } from 'react-icons/fi';

// Swiper imports
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Autoplay, FreeMode, EffectFade, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/free-mode';
import 'swiper/css/effect-fade';
import 'swiper/css/pagination';

// --- Static Helpers (Outside component to prevent re-creation) ---

const getDayName = (offset = 0) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return days[d.getDay()];
};

const getDayLabel = (offset = 0) => {
  if (offset === 0) return 'Today';
  if (offset === -1) return 'Yesterday';
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

// Generic fetch with retry for 429
const fetchWithRetry = async (apiFunc, retries = 3, delay = 2000) => {
  try {
    return await apiFunc();
  } catch (error) {
    if (error.response?.status === 429 && retries > 0) {
      console.warn(`Rate limited. Retrying in ${delay}ms... (${retries} left)`);
      await new Promise(r => setTimeout(r, delay));
      return fetchWithRetry(apiFunc, retries - 1, delay * 2);
    }
    throw error;
  }
};

// Filter duplicates by mal_id
const filterUnique = (arr) => {
  const seen = new Set();
  return arr.filter(item => {
    if (seen.has(item.mal_id)) return false;
    seen.add(item.mal_id);
    return true;
  });
};

function Home() {
  const [trendingAnime, setTrendingAnime] = useState([]);
  const [topAnime, setTopAnime] = useState([]);
  const [topPicks, setTopPicks] = useState([]);
  const [scheduleToday, setScheduleToday] = useState([]);
  const [scheduleYesterday, setScheduleYesterday] = useState([]);
  const [adventureAnime, setAdventureAnime] = useState([]);
  const [romanceAnime, setRomanceAnime] = useState([]);
  const [fantasyAnime, setFantasyAnime] = useState([]);
  const [newAnime, setNewAnime] = useState([]);
  const [matureAnime, setMatureAnime] = useState([]);
  const [upcomingAnime, setUpcomingAnime] = useState([]);
  const [showAllEpisodes, setShowAllEpisodes] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [picksLoading, setPicksLoading] = useState(true);
  const [genreLoading, setGenreLoading] = useState(true);
  const [featureLoading, setFeatureLoading] = useState(true);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const trendingRes = await fetchWithRetry(() => animeAPI.getTrendingAnime());
        if (trendingRes?.data?.data) {
          setTrendingAnime(filterUnique(trendingRes.data.data).slice(0, 21));
        }
        
        await new Promise(r => setTimeout(r, 1000));
        
        const topRes = await fetchWithRetry(() => animeAPI.getTopAnime());
        if (topRes?.data?.data) {
          setTopAnime(filterUnique(topRes.data.data).slice(0, 20));
        }
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTopPicks = async () => {
      setPicksLoading(true);
      try {
        const res = await fetchWithRetry(() => animeAPI.getTopPicksAnime());
        if (res?.data?.data) {
          setTopPicks(filterUnique(res.data.data).slice(0, 21));
        }
      } catch (error) {
        console.error('Error fetching top picks:', error);
      } finally {
        setPicksLoading(false);
      }
    };

    const fetchSchedule = async () => {
      setScheduleLoading(true);
      try {
        const todayDay = getDayName(0);
        const yesterdayDay = getDayName(-1);

        const todayRes = await fetchWithRetry(() => animeAPI.getSchedule(todayDay));
        if (todayRes?.data?.data) {
          setScheduleToday(filterUnique(todayRes.data.data).slice(0, 25));
        }

        await new Promise(r => setTimeout(r, 1500));

        const yesterdayRes = await fetchWithRetry(() => animeAPI.getSchedule(yesterdayDay));
        if (yesterdayRes?.data?.data) {
          setScheduleYesterday(filterUnique(yesterdayRes.data.data).slice(0, 25));
        }
      } catch (error) {
        console.error('Error fetching schedule:', error);
      } finally {
        setScheduleLoading(false);
      }
    };

    const fetchGenreData = async () => {
      setGenreLoading(true);
      try {
        const advRes = await fetchWithRetry(() => animeAPI.getGenreAnime(2));
        if (advRes?.data?.data) setAdventureAnime(filterUnique(advRes.data.data).slice(0, 14));
        
        await new Promise(r => setTimeout(r, 1500));
        
        const romRes = await fetchWithRetry(() => animeAPI.getGenreAnime(22));
        if (romRes?.data?.data) setRomanceAnime(filterUnique(romRes.data.data).slice(0, 14));
        
        await new Promise(r => setTimeout(r, 1500));
        
        const fanRes = await fetchWithRetry(() => animeAPI.getGenreAnime(10));
        if (fanRes?.data?.data) setFantasyAnime(filterUnique(fanRes.data.data).slice(0, 14));
      } catch (error) {
        console.error('Error fetching genre data:', error);
      } finally {
        setGenreLoading(false);
      }
    };

    const fetchFeatureData = async () => {
      setFeatureLoading(true);
      try {
        const newRes = await fetchWithRetry(() => animeAPI.getNewAnime());
        if (newRes?.data?.data) setNewAnime(filterUnique(newRes.data.data).slice(0, 14));
        
        await new Promise(r => setTimeout(r, 2000));
        
        const matureRes = await fetchWithRetry(() => animeAPI.getMatureAnime());
        if (matureRes?.data?.data) setMatureAnime(filterUnique(matureRes.data.data).slice(0, 14));

        await new Promise(r => setTimeout(r, 2000));

        const upcomingRes = await fetchWithRetry(() => animeAPI.getUpcomingAnime());
        if (upcomingRes?.data?.data) setUpcomingAnime(filterUnique(upcomingRes.data.data).slice(0, 8));
      } catch (error) {
        console.error('Error fetching feature data:', error);
      } finally {
        setFeatureLoading(false);
      }
    };

    fetchHomeData();
    const t1 = setTimeout(() => fetchTopPicks(), 3000);
    const t2 = setTimeout(() => fetchSchedule(), 6000);
    const t3 = setTimeout(() => fetchGenreData(), 10000);
    const t4 = setTimeout(() => fetchFeatureData(), 16000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, []);

  const getHeroImage = useCallback((anime) => {
    let ytId = anime.trailer?.youtube_id;
    if (!ytId && anime.trailer?.embed_url) {
      const match = anime.trailer.embed_url.match(/embed\/([^?]+)/);
      if (match && match[1]) ytId = match[1];
    }
    if (!ytId && anime.trailer?.url) {
      const vid = anime.trailer.url.split('v=')[1]?.split('&')[0];
      if (vid) ytId = vid;
    }

    if (anime.trailer?.images?.maximum_image_url) return anime.trailer.images.maximum_image_url;
    if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
    return anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
  }, []);

  const visibleToday = useMemo(() => 
    showAllEpisodes ? scheduleToday : scheduleToday.slice(0, 4), 
  [showAllEpisodes, scheduleToday]);

  const visibleYesterday = useMemo(() => 
    showAllEpisodes ? scheduleYesterday : scheduleYesterday.slice(0, 6), 
  [showAllEpisodes, scheduleYesterday]);

  const renderEpisodeCard = useCallback((anime, idx) => {
    const posterUrl = anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url;
    const broadcastTime = anime.broadcast?.time || null;

    return (
      <Link
        key={`ep-${anime.mal_id}-${idx}`}
        to={`/anime/${anime.mal_id}`}
        className="flex items-center gap-4 group hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors"
      >
        <div className="w-28 h-16 md:w-36 md:h-20 shrink-0 rounded-md overflow-hidden bg-anime-card border border-white/5 relative">
          <img
            src={posterUrl}
            alt={anime.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
            <svg className="w-8 h-8 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-200 group-hover:text-white truncate transition-colors">
            {anime.title_english || anime.title}
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            {anime.episodes ? `${anime.episodes} Episodes` : 'Ongoing'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">Sub</span>
            <span className="text-[10px] font-bold text-cyan-400 bg-cyan-400/10 px-1.5 py-0.5 rounded">Dub</span>
          </div>
        </div>

        {broadcastTime && (
          <span className="text-xs font-mono text-cyan-400 shrink-0 hidden sm:block">
            {broadcastTime}
          </span>
        )}
      </Link>
    );
  }, []);

  return (
    <div className="pb-10">
      {/* Hero Section Carousel */}
      <section className="w-full relative -mt-20">
        {loading ? (
          <div className="w-full min-h-[500px] md:min-h-[700px] bg-anime-card/50 animate-pulse flex items-center justify-center">
            <div className="w-20 h-20 border-4 border-anime-primary/30 border-t-anime-primary rounded-full animate-spin"></div>
          </div>
        ) : (
          <Swiper
            modules={[Autoplay, EffectFade, Pagination]}
            effect="fade"
            slidesPerView={1}
            autoplay={{ delay: 6000, disableOnInteraction: false }}
            pagination={{ clickable: true, dynamicBullets: true }}
            loop={true}
            className="hero-swiper w-full h-full min-h-[600px] md:min-h-[850px] bg-anime-bg"
          >
            {topAnime.slice(0, 5).map(anime => (
              <SwiperSlide key={`hero-${anime.mal_id}`}>
                <div className="relative w-full h-full flex flex-col justify-end px-4 sm:px-8 md:px-16 lg:px-24 pb-[170px] md:pb-[290px] pt-32 min-h-[600px] md:min-h-[850px]">
                  {/* High Quality Background Image */}
                  <div
                    className="absolute inset-0 w-full h-full transition-transform duration-[10000ms] hover:scale-105"
                    style={{
                      backgroundImage: `url(${getHeroImage(anime)})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center 20%',
                      backgroundRepeat: 'no-repeat'
                    }}
                  ></div>

                  {/* Deep Shadow Gradients for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-anime-bg via-anime-bg/80 to-transparent z-10 w-full md:w-3/4"></div>
                  <div className="absolute inset-0 bg-gradient-to-t from-anime-bg/70 via-anime-bg/20 to-transparent z-10"></div>
                  <div className="absolute inset-0 bg-black/10 z-10 w-full h-full"></div>

                  {/* Content Area */}
                  <div className="relative z-20 max-w-3xl space-y-4 md:space-y-6">
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="bg-gradient-to-r from-anime-primary to-anime-accent text-white px-3 py-1 rounded shadow-[0_0_10px_rgba(236,72,153,0.5)] text-xs font-bold tracking-wider uppercase flex items-center gap-1">
                        🏆 Rank #{anime.rank || 'N/A'}
                      </span>
                      {anime.type && (
                        <span className="bg-white/10 backdrop-blur-md text-white px-3 py-1 rounded text-xs font-semibold shadow border border-white/10">
                          {anime.type}
                        </span>
                      )}
                      {anime.year && (
                        <span className="bg-white/10 backdrop-blur-md text-white text-xs font-semibold px-2 py-1 rounded">
                          {anime.year}
                        </span>
                      )}
                      {anime.score && (
                        <span className="bg-white/10 backdrop-blur-md text-anime-secondary text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                          ★ {anime.score}
                        </span>
                      )}
                    </div>

                    <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white leading-[1.1] drop-shadow-2xl font-serif">
                      {anime.title_english || anime.title}
                    </h1>

                    <p className="text-gray-300 text-sm md:text-base lg:text-lg line-clamp-3 md:line-clamp-4 max-w-2xl drop-shadow-lg font-medium leading-relaxed">
                      {anime.synopsis?.replace(/\[Written by MAL Rewrite\]/g, '').trim()}
                    </p>

                    <div className="pt-6 pb-2 flex items-center gap-4">
                      <Link to={`/anime/${anime.mal_id}`} className="bg-anime-primary hover:bg-anime-accent text-white font-black py-4 px-8 md:px-10 rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(236,72,153,0.5)] hover:shadow-[0_0_30px_rgba(236,72,153,0.8)] flex items-center gap-2 transform hover:-translate-y-1 text-sm md:text-base uppercase tracking-wider">
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                        Watch Now
                      </Link>
                      <button className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-4 px-8 rounded-full transition-all duration-300 border border-white/20 text-sm md:text-base hidden sm:block">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        )}
      </section>

      {/* Trending Now */}
      <section id="trending" className="w-full relative z-30 -mt-32 md:-mt-56 px-4 md:px-8">
        <div className="flex items-center justify-between mb-4 px-1 relative z-40">
          <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
            Trending Now <span className="w-2.5 h-2.5 rounded-full bg-anime-secondary animate-pulse shadow-[0_0_10px_#ec4899]"></span>
          </h2>
        </div>

        <div className="-mx-2 px-2 pb-6">
          {loading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="w-[14%] shrink-0">
                  <LoadingSkeleton count={1} />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={true}
              freeMode={true}
              grabCursor={true}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
                1536: { slidesPerView: 7 },
              }}
              className="w-full !px-1 !py-4"
            >
              {trendingAnime && trendingAnime.length > 0 && trendingAnime.map((anime, idx) => (
                <SwiperSlide key={`trend-${anime.mal_id}-${idx}`} className="h-auto pb-4 pt-1">
                  <AnimeCard anime={anime} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* Top Picks For You */}
      <section className="px-4 md:px-8 mt-16 md:mt-24">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
            Top Picks For You <span className="text-amber-400 text-lg">✨</span>
          </h2>
        </div>
        <div className="relative mx-[-8px] px-[8px]">
          {picksLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="w-[14%] shrink-0">
                  <LoadingSkeleton count={1} />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={true}
              freeMode={true}
              grabCursor={true}
              autoplay={{ delay: 5000, disableOnInteraction: false }}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
                1536: { slidesPerView: 7 },
              }}
              className="w-full !px-1 !py-4"
            >
              {topPicks.map((anime, idx) => (
                <SwiperSlide key={`picks-${anime.mal_id}-${idx}`} className="h-auto pb-4 pt-1">
                  <AnimeCard anime={anime} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* Top Anime Of All Time */}
      <section className="px-4 md:px-8 mt-16 md:mt-24">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
            Top Anime of All Time <span className="text-anime-primary">🏆</span>
          </h2>
        </div>
        <div className="relative mx-[-8px] px-[8px]">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              <LoadingSkeleton count={6} />
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={true}
              freeMode={true}
              grabCursor={true}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
                1536: { slidesPerView: 7 },
              }}
              className="w-full !px-1 !py-4"
            >
              {topAnime.map((anime, idx) => (
                <SwiperSlide key={`top-${anime.mal_id}-${idx}`} className="h-auto pb-4 pt-1">
                  <AnimeCard anime={anime} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* Trending Adventure */}
      <section className="px-4 md:px-8 mt-16 md:mt-24">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
            Trending Adventure Anime <span className="text-orange-400 text-lg">⚔️</span>
          </h2>
        </div>
        <div className="relative mx-[-8px] px-[8px]">
          {genreLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="w-[14%] shrink-0">
                  <LoadingSkeleton count={1} />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={true}
              freeMode={true}
              grabCursor={true}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
                1536: { slidesPerView: 7 },
              }}
              className="w-full !px-1 !py-4"
            >
              {adventureAnime.map((anime, idx) => (
                <SwiperSlide key={`adv-${anime.mal_id}-${idx}`} className="h-auto pb-4 pt-1">
                  <AnimeCard anime={anime} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* Romance & Love Stories */}
      <section className="px-4 md:px-8 mt-16 md:mt-24">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
            Romance & Love Stories <span className="text-rose-400 text-lg">❤️</span>
          </h2>
        </div>
        <div className="relative mx-[-8px] px-[8px]">
          {genreLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="w-[14%] shrink-0">
                  <LoadingSkeleton count={1} />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={true}
              freeMode={true}
              grabCursor={true}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
                1536: { slidesPerView: 7 },
              }}
              className="w-full !px-1 !py-4"
            >
              {romanceAnime.map((anime, idx) => (
                <SwiperSlide key={`rom-${anime.mal_id}-${idx}`} className="h-auto pb-4 pt-1">
                  <AnimeCard anime={anime} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* Fantasy Highlights */}
      <section className="px-4 md:px-8 mt-16 md:mt-24">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
            Trending Fantasy Anime <span className="text-indigo-400 text-lg">🪄</span>
          </h2>
        </div>
        <div className="relative mx-[-8px] px-[8px]">
          {genreLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="w-[14%] shrink-0">
                  <LoadingSkeleton count={1} />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={true}
              freeMode={true}
              grabCursor={true}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
                1536: { slidesPerView: 7 },
              }}
              className="w-full !px-1 !py-4"
            >
              {fantasyAnime.map((anime, idx) => (
                <SwiperSlide key={`fan-${anime.mal_id}-${idx}`} className="h-auto pb-4 pt-1">
                  <AnimeCard anime={anime} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* New On AnimePh */}
      <section className="px-4 md:px-8 mt-16 md:mt-24">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
            New On AnimePh <span className="text-cyan-400 text-lg">🆕</span>
          </h2>
        </div>
        <div className="relative mx-[-8px] px-[8px]">
          {featureLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="w-[14%] shrink-0">
                  <LoadingSkeleton count={1} />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={true}
              freeMode={true}
              grabCursor={true}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
                1536: { slidesPerView: 7 },
              }}
              className="w-full !px-1 !py-4"
            >
              {newAnime && newAnime.length > 0 && newAnime.map((anime, idx) => (
                <SwiperSlide key={`new-${anime.mal_id}-${idx}`} className="h-auto pb-4 pt-1">
                  <AnimeCard anime={anime} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* Trending 18+ */}
      <section className="px-4 md:px-8 mt-16 md:mt-24">
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
            Trending 18+ Anime <span className="text-red-500 text-lg">🔞</span>
          </h2>
          <span className="text-[10px] font-bold text-red-500/80 uppercase tracking-[0.2em] border border-red-500/30 px-2 py-1 rounded">Mature Content</span>
        </div>
        <div className="relative mx-[-8px] px-[8px]">
          {featureLoading ? (
            <div className="flex gap-4 overflow-hidden">
              {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="w-[14%] shrink-0">
                  <LoadingSkeleton count={1} />
                </div>
              ))}
            </div>
          ) : (
            <Swiper
              modules={[Navigation, Autoplay, FreeMode]}
              spaceBetween={20}
              slidesPerView={2}
              navigation={true}
              freeMode={true}
              grabCursor={true}
              breakpoints={{
                640: { slidesPerView: 3 },
                768: { slidesPerView: 4 },
                1024: { slidesPerView: 5 },
                1280: { slidesPerView: 6 },
                1536: { slidesPerView: 7 },
              }}
              className="w-full !px-1 !py-4"
            >
              {matureAnime && matureAnime.length > 0 && matureAnime.map((anime, idx) => (
                <SwiperSlide key={`mat-${anime.mal_id}-${idx}`} className="h-auto pb-4 pt-1">
                  <AnimeCard anime={anime} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </div>
      </section>

      {/* New Episodes & Top Upcoming Side-by-Side */}
      <section className="px-4 md:px-8 mt-16 md:mt-24 mb-24">
        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* Left Column: New Episodes */}
          <div className="xl:w-[72%]">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white">
                <span className="text-cyan-400">📺</span> New Episodes
              </h2>
            </div>

            {scheduleLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="h-20 bg-anime-card/50 animate-pulse rounded-lg"></div>
                ))}
              </div>
            ) : (
              <div className="bg-transparent rounded-xl border border-white/5 p-4 md:p-6 space-y-8">
                {/* Today */}
                {scheduleToday.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                      Today
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse"></span>
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                      {visibleToday.map((anime, idx) => renderEpisodeCard(anime, idx))}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {scheduleToday.length > 0 && scheduleYesterday.length > 0 && (
                  <div className="border-t border-white/5"></div>
                )}

                {/* Yesterday */}
                {scheduleYesterday.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">
                      Yesterday
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                      {visibleYesterday.map((anime, idx) => renderEpisodeCard(anime, idx))}
                    </div>
                  </div>
                )}

                {/* Show More / Show Less */}
                {(scheduleToday.length > 4 || scheduleYesterday.length > 6) && (
                  <button
                    onClick={() => setShowAllEpisodes(!showAllEpisodes)}
                    className="w-full py-3 text-center text-sm font-bold uppercase tracking-widest text-cyan-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-all border border-white/5 hover:border-white/10"
                  >
                    {showAllEpisodes ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Top Upcoming */}
          <div className="xl:w-[28%]">
            <div className="flex items-center justify-between mb-6 px-1">
              <h2 className="text-2xl font-bold flex items-center gap-3 drop-shadow-lg text-white font-serif">
                Top Upcoming <span className="text-orange-400 text-lg">🚀</span>
              </h2>
            </div>
            
            <div className="bg-anime-card/40 backdrop-blur-md rounded-2xl border border-white/5 p-5 space-y-5 shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-[80px] rounded-full -mr-16 -mt-16 pointer-events-none"></div>
              
              {featureLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-4">
                      <div className="w-16 h-24 bg-white/5 animate-pulse rounded-lg shrink-0"></div>
                      <div className="flex-1 space-y-2 py-2">
                        <div className="h-4 bg-white/5 animate-pulse rounded w-3/4"></div>
                        <div className="h-3 bg-white/5 animate-pulse rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {upcomingAnime && upcomingAnime.length > 0 && upcomingAnime.map((anime, idx) => (
                    <Link 
                      to={`/anime/${anime.mal_id}`} 
                      key={`up-${anime.mal_id}-${idx}`} 
                      className="flex gap-4 group/item hover:bg-white/[0.03] p-2.5 rounded-xl transition-all duration-300 relative border border-transparent hover:border-white/5"
                    >
                      <div className="relative shrink-0">
                        <img 
                          src={anime.images?.webp?.small_image_url || anime.images?.jpg?.small_image_url} 
                          className="w-16 h-22 object-cover rounded-lg shadow-lg border border-white/10 group-hover/item:border-orange-500/30 transition-colors" 
                          alt={anime.title}
                        />
                        <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-md text-[10px] font-black text-white px-1.5 py-0.5 rounded-md border border-white/10">
                          #{idx + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <h4 className="text-white text-[13px] font-bold truncate group-hover/item:text-orange-400 transition-colors">
                          {anime.title_english || anime.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-[9px] text-gray-500 uppercase font-black tracking-wider text-ellipsis overflow-hidden whitespace-nowrap">{anime.type || 'TV'}</span>
                          <span className="w-1 h-1 rounded-full bg-white/10"></span>
                          <span className="text-[9px] text-orange-400/80 font-bold uppercase tracking-tighter">🔥 Upcoming</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[11px]">
                           <span className="text-gray-400 font-medium">Coming Soon</span>
                           <FiStar className="text-gray-600 group-hover/item:text-orange-500 transition-colors" />
                        </div>
                      </div>
                    </Link>
                  ))}
                  
                  <Link to="/top-anime" className="block w-full mt-4 py-3 text-center text-[11px] font-black uppercase tracking-[0.2em] text-gray-500 hover:text-white transition-colors border-t border-white/5 pt-5">
                    View Full Calendar
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Home;
