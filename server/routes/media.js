import express from 'express';

const router = express.Router();

const TMDB_API_KEY = process.env.TMDB_API_KEY || '16f62d38fec24f4e6c2adc9388da20ce';
const TMDB_BASE_URL = process.env.TMDB_BASE_URL || 'https://api.themoviedb.org/3';
const ANILIST_URL = process.env.ANILIST_GRAPHQL_URL || 'https://graphql.anilist.co';
const BINTV_URL = process.env.BINTV_API_URL || 'https://bintvjson.lovable.app/api/public/bintvjson';

const defaultHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'application/json'
};

// Helper for TMDB requests using native fetch
async function tmdbFetch(endpoint, params = {}) {
  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set('api_key', TMDB_API_KEY);
  url.searchParams.set('language', 'en-US');

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  });

  const response = await fetch(url.toString(), {
    headers: defaultHeaders,
    signal: AbortSignal.timeout(10000)
  });

  if (!response.ok) {
    throw new Error(`TMDB error status ${response.status}`);
  }

  return await response.json();
}

function tagTmdbItem(item, forcedType) {
  if (!item) return item;
  const mediaType = forcedType || item.media_type || (item.first_air_date ? 'tv' : 'movie');
  const genres = Array.isArray(item.genre_ids)
    ? item.genre_ids
    : Array.isArray(item.genres)
    ? item.genres.map((g) => g.id)
    : [];
  const isAnime = Boolean(item.isAnime || (genres.includes(16) && item.original_language === 'ja'));
  return {
    ...item,
    media_type: mediaType,
    isAnime,
    tmdbId: item.id
  };
}

// 1. Trending All (Movies + TV)
router.get('/trending', async (req, res) => {
  try {
    const data = await tmdbFetch('/trending/all/day');
    const results = (data.results || [])
      .filter((i) => i.media_type === 'movie' || i.media_type === 'tv')
      .map((i) => tagTmdbItem(i));
    res.json({ success: true, results });
  } catch (error) {
    console.error('TMDB trending error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. Popular Movies
router.get('/movies/popular', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const data = await tmdbFetch('/movie/popular', { page });
    res.json({ success: true, results: (data.results || []).map((i) => tagTmdbItem(i, 'movie')) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. Top Rated Movies
router.get('/movies/top-rated', async (req, res) => {
  try {
    const data = await tmdbFetch('/movie/top_rated');
    res.json({ success: true, results: (data.results || []).map((i) => tagTmdbItem(i, 'movie')) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. Movies by Genre
router.get('/movies/genre/:genreId', async (req, res) => {
  try {
    const { genreId } = req.params;
    const data = await tmdbFetch('/discover/movie', {
      with_genres: genreId,
      sort_by: 'popularity.desc'
    });
    res.json({ success: true, results: (data.results || []).map((i) => tagTmdbItem(i, 'movie')) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. Popular TV Shows
router.get('/tv/popular', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/popular');
    res.json({ success: true, results: (data.results || []).map((i) => tagTmdbItem(i, 'tv')) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. Top Rated TV Shows
router.get('/tv/top-rated', async (req, res) => {
  try {
    const data = await tmdbFetch('/tv/top_rated');
    res.json({ success: true, results: (data.results || []).map((i) => tagTmdbItem(i, 'tv')) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. Streaming Network Originals (Netflix: 213, Amazon Prime: 1024, HBO: 49)
router.get('/tv/originals', async (req, res) => {
  try {
    const network = req.query.network || '213';
    const data = await tmdbFetch('/discover/tv', {
      with_networks: network,
      sort_by: 'popularity.desc'
    });
    res.json({ success: true, results: (data.results || []).map((i) => tagTmdbItem(i, 'tv')) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. Media Details (with trailers, credits, recommendations, similar)
router.get('/details/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const cleanId = parseInt(String(id), 10) || id;
    const validMedia = type === 'tv' ? 'tv' : 'movie';
    const data = await tmdbFetch(`/${validMedia}/${cleanId}`, {
      append_to_response: 'videos,credits,recommendations,similar,content_ratings,release_dates'
    });

    // Extract official trailer if present
    const trailer = data.videos?.results?.find(
      v => (v.type === 'Trailer' || v.type === 'Teaser') && v.site === 'YouTube'
    ) || data.videos?.results?.[0];

    res.json({
      success: true,
      data: {
        ...tagTmdbItem(data, validMedia),
        trailerKey: trailer ? trailer.key : null
      }
    });
  } catch (error) {
    console.error('Details error:', error.message);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. TV Season Episodes
router.get('/tv/:id/season/:seasonNumber', async (req, res) => {
  try {
    const { id, seasonNumber } = req.params;
    const data = await tmdbFetch(`/tv/${id}/season/${seasonNumber}`);
    res.json({ success: true, episodes: data.episodes || [] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. Multi Search
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    if (!query || !query.trim()) {
      return res.json({ success: true, results: [] });
    }
    const data = await tmdbFetch('/search/multi', {
      query: query.trim(),
      include_adult: false
    });
    const filtered = (data.results || [])
      .filter((item) => item.media_type === 'movie' || item.media_type === 'tv')
      .map((item) => tagTmdbItem(item));
    res.json({ success: true, results: filtered });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Cache AniList ID -> TMDB match so repeat loads stay instant
const animeTmdbCache = new Map();

async function resolveAnimeToTmdb(anime) {
  if (animeTmdbCache.has(anime.id)) {
    return animeTmdbCache.get(anime.id);
  }
  const searchType = anime.format === 'MOVIE' ? 'movie' : 'tv';
  const candidates = [anime.title?.english, anime.title?.romaji].filter(Boolean);

  for (const title of candidates) {
    try {
      const data = await tmdbFetch(`/search/${searchType}`, { query: title });
      const results = data.results || [];
      const exact =
        results.find(
          (r) =>
            (r.genre_ids || []).includes(16) &&
            (!anime.seasonYear ||
              String(r.first_air_date || r.release_date || '').startsWith(String(anime.seasonYear)))
        ) ||
        results.find((r) => (r.genre_ids || []).includes(16)) ||
        results[0];

      if (exact?.id) {
        const resolved = { tmdbId: exact.id, mediaType: searchType };
        animeTmdbCache.set(anime.id, resolved);
        return resolved;
      }
    } catch {
      // try next title variant
    }
  }
  animeTmdbCache.set(anime.id, null);
  return null;
}

// 11. AniList Anime API (resolved with TMDB IDs for Vidstuck/VidSrc + Vumeto /embed/anime/tmdb)
router.get('/anime/trending', async (req, res) => {
  const graphqlQuery = {
    query: `
      query {
        Page(page: 1, perPage: 24) {
          media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
            id
            idMal
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              extraLarge
              color
            }
            bannerImage
            description
            format
            episodes
            duration
            genres
            averageScore
            popularity
            seasonYear
            status
          }
        }
      }
    `
  };

  try {
    const response = await fetch(ANILIST_URL, {
      method: 'POST',
      headers: { ...defaultHeaders, 'Content-Type': 'application/json' },
      body: JSON.stringify(graphqlQuery),
      signal: AbortSignal.timeout(10000)
    });
    const json = await response.json();
    const list = json?.data?.Page?.media || [];

    const resolvedList = await Promise.all(list.map((a) => resolveAnimeToTmdb(a)));

    const formatted = list.map((a, idx) => {
      const tmdbMatch = resolvedList[idx];
      const fallbackType = a.format === 'MOVIE' ? 'movie' : 'anime';
      return {
        id: tmdbMatch?.tmdbId || a.id,
        tmdbId: tmdbMatch?.tmdbId || null,
        anilistId: a.id,
        idMal: a.idMal,
        media_type: tmdbMatch?.mediaType || fallbackType,
        isAnime: true,
        animeFormat: a.format === 'MOVIE' ? 'movie' : 'tv',
        title: a.title.english || a.title.romaji || a.title.native,
        name: a.title.english || a.title.romaji,
        overview: (a.description || '').replace(/<[^>]*>/g, ''),
        poster_path: a.coverImage.extraLarge || a.coverImage.large,
        backdrop_path: a.bannerImage || a.coverImage.extraLarge,
        vote_average: a.averageScore ? (a.averageScore / 10).toFixed(1) : '7.5',
        release_date: a.seasonYear ? String(a.seasonYear) : 'Recent',
        episodes: a.episodes,
        genres: a.genres,
        status: a.status
      };
    });

    res.json({ success: true, results: formatted });
  } catch (error) {
    console.error('AniList error, falling back to TMDB anime:', error.message);
    try {
      const fallback = await tmdbFetch('/discover/tv', {
        with_genres: '16',
        with_original_language: 'ja',
        sort_by: 'popularity.desc'
      });
      res.json({
        success: true,
        results: (fallback.results || []).map((i) => ({ ...tagTmdbItem(i, 'tv'), isAnime: true }))
      });
    } catch (fallbackErr) {
      res.status(500).json({ success: false, message: fallbackErr.message });
    }
  }
});

// 12. BinTV Live Sports
router.get('/sports/live', async (req, res) => {
  try {
    const response = await fetch(BINTV_URL, {
      headers: defaultHeaders,
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new Error(`BinTV responded ${response.status}`);
    const catalog = await response.json();
    const liveEvents = catalog['Live Events'] || [];
    const upcomingEvents = catalog['Upcoming Events'] || [];
    const channels = catalog['Channels'] || [];

    res.json({
      success: true,
      live: liveEvents,
      upcoming: upcomingEvents,
      channels: channels.slice(0, 20)
    });
  } catch (error) {
    console.warn('BinTV live fetch warning:', error.message);
    res.json({
      success: true,
      live: [
        {
          id: 'sport-1',
          name: 'Real Madrid vs Manchester City',
          category: 'Football',
          status: 'LIVE',
          poster: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
          streams: [{ name: 'HD Main Feed', url: 'https://bintv-sources.pages.dev' }]
        },
        {
          id: 'sport-2',
          name: 'Los Angeles Lakers vs Golden State Warriors',
          category: 'Basketball',
          status: 'LIVE',
          poster: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
          streams: [{ name: 'Court View', url: 'https://bintv-sources.pages.dev' }]
        },
        {
          id: 'sport-3',
          name: 'UFC 312: Main Event Fight Card',
          category: 'MMA',
          status: 'LIVE',
          poster: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&q=80',
          streams: [{ name: 'Octagon Feed', url: 'https://bintv-sources.pages.dev' }]
        }
      ],
      upcoming: [
        {
          id: 'sport-4',
          name: 'Formula 1 Grand Prix Qualifying',
          category: 'Motorsport',
          status: 'Upcoming - 19:00',
          poster: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=800&q=80'
        },
        {
          id: 'sport-5',
          name: 'Arsenal vs Liverpool',
          category: 'Football',
          status: 'Tomorrow 20:45',
          poster: 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=800&q=80'
        }
      ]
    });
  }
});

export default router;
