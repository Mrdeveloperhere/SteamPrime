// Verified Video Embed & Stream Providers

/**
 * Extracts a clean numeric ID from TMDB IDs, slugs ("1400837-other-mommy"),
 * paths ("/tv/108978/"), or full TMDB URLs ("https://www.themoviedb.org/tv/80623").
 */
export function extractNumericId(raw) {
  if (raw === null || raw === undefined) return '';
  const str = String(raw).trim();
  const pathMatch = str.match(/\/(?:tv|movie)\/(\d+)/i);
  if (pathMatch) return pathMatch[1];
  const leadingMatch = str.match(/^(\d+)/);
  if (leadingMatch) return leadingMatch[1];
  return encodeURIComponent(str);
}

/**
 * Normalizes Movie, Series, and Anime metadata (TMDB & AniList) into
 * clean embed parameters for Vumeto, Vidstuck, VidSrc PM, 2Embed, and Smashy.
 */
export function resolveMediaContext(media = {}) {
  const rawStr = String(media.tmdbUrl || media.id || media.mediaId || '');
  const pathTypeMatch = rawStr.match(/\/(tv|movie)\/\d+/i);
  const detectedType = pathTypeMatch ? pathTypeMatch[1].toLowerCase() : null;

  const isTv =
    detectedType === 'tv' ||
    media.media_type === 'tv' ||
    (media.media_type === 'anime' && media.animeFormat !== 'movie') ||
    Boolean(media.first_air_date) ||
    Number(media.number_of_seasons) > 0;

  const type = isTv ? 'tv' : 'movie';

  const genreIds = Array.isArray(media.genre_ids)
    ? media.genre_ids
    : Array.isArray(media.genres)
    ? media.genres.map((g) => g?.id).filter(Boolean)
    : [];

  const isAnime = Boolean(
    media.isAnime ||
      media.media_type === 'anime' ||
      media.anilistId ||
      (genreIds.includes(16) && media.original_language === 'ja')
  );

  const hasTmdbId = Boolean(media.tmdbId) || media.media_type !== 'anime';
  const tmdbId = hasTmdbId ? extractNumericId(media.tmdbId || media.id || media.mediaId) : null;
  const anilistId = media.anilistId ? extractNumericId(media.anilistId) : (!hasTmdbId ? extractNumericId(media.id || media.mediaId) : null);

  return {
    type,
    tmdbId: tmdbId || extractNumericId(media.id || media.mediaId),
    hasTmdbId: Boolean(tmdbId),
    anilistId,
    isAnime
  };
}

export const EMBED_SERVERS = [
  {
    id: 'vidsrc_pm',
    name: 'Server 1 (VidSrc PM)',
    tag: 'Recommended',
    description: 'Instant 1080p stream with zero buffering & full video display',
    buildUrl: (type, id, season = 1, episode = 1) => {
      const cleanId = extractNumericId(id);
      if (type === 'tv') {
        return `https://vidsrc.pm/embed/tv/${cleanId}/${season}/${episode}`;
      }
      return `https://vidsrc.pm/embed/movie/${cleanId}`;
    }
  },
  {
    id: 'vidstuck',
    name: 'Server 2 (Vidstuck HD)',
    tag: 'GaiaFlix Fast',
    description: 'GaiaFlix primary server for movies, series, and TMDB anime',
    buildUrl: (type, id, season = 1, episode = 1) => {
      const cleanId = extractNumericId(id);
      if (type === 'tv') {
        return `https://vidstuck.cc/embed/tv/${cleanId}/${season}/${episode}`;
      }
      return `https://vidstuck.cc/embed/movie/${cleanId}`;
    }
  },
  {
    id: 'twoembed',
    name: 'Server 3 (2Embed Stream)',
    tag: 'Multi-CDN',
    description: 'Zero-latency global multi-server video player',
    buildUrl: (type, id, season = 1, episode = 1) => {
      const cleanId = extractNumericId(id);
      if (type === 'tv') {
        return `https://www.2embed.cc/embedtv/${cleanId}&s=${season}&e=${episode}`;
      }
      return `https://www.2embed.cc/embed/${cleanId}`;
    }
  },
  {
    id: 'vumeto',
    name: 'Server 4 (Vumeto Stream)',
    tag: 'GaiaFlix Legacy',
    description: 'Vumeto player with TMDB/AniList Anime & Cinema routing',
    buildUrl: (type, id, season = 1, episode = 1, _trailerKey, ctx = {}) => {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
      const cleanId = extractNumericId(id);

      let path;
      if (ctx.isAnime) {
        if (ctx.hasTmdbId !== false && cleanId) {
          path = `/embed/anime/tmdb/${cleanId}/${episode}`;
        } else if (ctx.anilistId) {
          path = `/embed/anime/anilist/${ctx.anilistId}/${episode}`;
        }
      }
      if (!path) {
        path =
          type === 'tv'
            ? `/embed/tv/${cleanId}/${season}/${episode}`
            : `/embed/movie/${cleanId}`;
      }

      const url = new URL(`https://vumeto.xyz${path}`);
      if (ctx.isAnime) {
        url.searchParams.set('season', String(season));
        url.searchParams.set('format', type);
        url.searchParams.set('dub', 'sub');
      }
      url.searchParams.set('autoplay', '1');
      url.searchParams.set('muted', '0');
      url.searchParams.set('autonext', '1');
      url.searchParams.set('parentOrigin', origin);
      return url.toString();
    }
  },
  {
    id: 'smashy',
    name: 'Server 5 (SmashyStream)',
    tag: 'Alternative',
    description: 'High compatibility backup stream',
    buildUrl: (type, id, season = 1, episode = 1) => {
      const cleanId = extractNumericId(id);
      if (type === 'tv') {
        return `https://player.smashystream.com/tv/${cleanId}?s=${season}&e=${episode}`;
      }
      return `https://player.smashystream.com/movie/${cleanId}`;
    }
  },
  {
    id: 'trailer',
    name: 'Official Trailer (YouTube)',
    tag: 'HD Promo',
    isTrailer: true,
    buildUrl: (type, id, season, episode, trailerKey) => {
      if (trailerKey) {
        return `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`;
      }
      return null;
    }
  }
];

export function getPlayerEmbedUrl(server, media, trailerKey, season = 1, episode = 1) {
  if (!server) server = EMBED_SERVERS[0];
  const ctx = resolveMediaContext(media);

  if (server.isTrailer || server.id === 'trailer') {
    if (trailerKey) {
      return `https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&rel=0&modestbranding=1`;
    }
    return null;
  }

  if (server.buildUrl) {
    return server.buildUrl(ctx.type, ctx.tmdbId, season, episode, trailerKey, ctx);
  }

  return `https://vidsrc.pm/embed/${ctx.type === 'tv' ? `tv/${ctx.tmdbId}/${season}/${episode}` : `movie/${ctx.tmdbId}`}`;
}
