import axios from 'axios';

// Get or generate guest session ID
export function getSessionId() {
  let id = localStorage.getItem('streamprime_session_id');
  if (!id) {
    id = 'guest_' + Math.random().toString(36).substring(2, 12) + Date.now().toString(36);
    localStorage.setItem('streamprime_session_id', id);
  }
  return id;
}

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach session ID to every request
api.interceptors.request.use(config => {
  const sessionId = getSessionId();
  config.headers['x-session-id'] = sessionId;
  return config;
});

// Image helper for TMDB
export const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p';

export function getImageUrl(path, size = 'w500') {
  if (!path) return 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function getBackdropUrl(path, size = 'original') {
  if (!path) return 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=1600&q=80';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

// Media endpoints
export const fetchTrending = async () => (await api.get('/media/trending')).data;
export const fetchPopularMovies = async () => (await api.get('/media/movies/popular')).data;
export const fetchTopRatedMovies = async () => (await api.get('/media/movies/top-rated')).data;
export const fetchMoviesByGenre = async (genreId) => (await api.get(`/media/movies/genre/${genreId}`)).data;
export const fetchPopularTV = async () => (await api.get('/media/tv/popular')).data;
export const fetchTopRatedTV = async () => (await api.get('/media/tv/top-rated')).data;
export const fetchOriginals = async (network = '213') => (await api.get(`/media/tv/originals?network=${network}`)).data;
export const fetchMediaDetails = async (type, id) => (await api.get(`/media/details/${type}/${id}`)).data;
export const fetchSeasonEpisodes = async (id, season) => (await api.get(`/media/tv/${id}/season/${season}`)).data;
export const searchMedia = async (q) => (await api.get(`/media/search?q=${encodeURIComponent(q)}`)).data;
export const fetchTrendingAnime = async () => (await api.get('/media/anime/trending')).data;
export const fetchLiveSports = async () => (await api.get('/media/sports/live')).data;

// Session endpoints
export const fetchSession = async () => (await api.get('/session')).data;
export const toggleWatchlist = async (mediaItem) => (await api.post('/session/watchlist', mediaItem)).data;
export const updateHistory = async (historyItem) => (await api.post('/session/history', historyItem)).data;
export const removeHistory = async (mediaId) => (await api.delete(`/session/history/${mediaId}`)).data;

export default api;
