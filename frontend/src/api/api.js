import axios from 'axios';
// Trigger HMR cache invalidation

const JIKAN_BASE_URL = 'https://api.jikan.moe/v4';

// Jikan API Client
export const api = axios.create({
  baseURL: JIKAN_BASE_URL,
  timeout: 10000,
});

// Specific API Endpoints
export const animeAPI = {
  getTopAnime: () => api.get('/top/anime'),
  getTrendingAnime: () => api.get('/seasons/now'),
  searchAnime: (query) => api.get(`/anime?q=${query}&sfw=true`),
  getAnimeDetails: (id) => api.get(`/anime/${id}/full`),
  getAnimeEpisodes: (id) => api.get(`/anime/${id}/episodes`),
  getAnimeRelations: (id) => api.get(`/anime/${id}/relations`),
  getTopPicksAnime: () => api.get('/top/anime?filter=favorite&limit=21'),
  getSchedule: (day) => api.get(`/schedules?filter=${day}&sfw=true`),
  getGenreAnime: (genreId) => api.get(`/anime?genres=${genreId}&order_by=score&sort=desc&sfw=true`),
  getUpcomingAnime: () => api.get('/top/anime?filter=upcoming'),
  getNewAnime: () => api.get('/anime?order_by=start_date&sort=desc&sfw=true'),
  getMatureAnime: () => api.get('/anime?genres=9&order_by=score&sort=desc&sfw=false'), // 9=Ecchi
};

// Standalone export to bypass Vite HMR object mutation issues
export const fetchAnimeRelations = (id) => api.get(`/anime/${id}/relations`);

// Backend API (Our Express Server on Render or Local)
const BACKEND_BASEURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const backendAPI = axios.create({
  baseURL: BACKEND_BASEURL,
});

export const watchAPI = {
  getServers: (episodeId, malId, ep) => backendAPI.get(`/episodes/servers/${episodeId}?mal_id=${malId}&ep=${ep}`),
  getSource: (serverId) => backendAPI.get(`/episodes/sources/${serverId}`),
};
