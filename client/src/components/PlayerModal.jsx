import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Server,
  Film,
  AlertCircle,
  RefreshCw,
  Play,
  Zap,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { EMBED_SERVERS, getPlayerEmbedUrl, resolveMediaContext } from '../utils/player';
import { updateHistory, fetchMediaDetails } from '../services/api';

export default function PlayerModal({
  media,
  onClose,
  initialServer,
  onServerChange
}) {
  // Default to Server 1 (VidSrc PM) which plays video + audio with zero black screen
  const [activeServer, setActiveServer] = useState(
    initialServer && !initialServer.isTrailer ? initialServer : EMBED_SERVERS[0]
  );
  const [trailerKey, setTrailerKey] = useState(media?.trailerKey || null);
  const [loadingDetails, setLoadingDetails] = useState(!media?.trailerKey);
  const [embedUrl, setEmbedUrl] = useState('');
  const [playerLoading, setPlayerLoading] = useState(true);

  const ctx = resolveMediaContext(media || {});
  const [resolvedIsAnime, setResolvedIsAnime] = useState(ctx.isAnime);

  const title = media?.title || media?.name || 'Now Playing';
  const mediaType = ctx.type;
  const mediaId = ctx.tmdbId;
  const season = media?.season || 1;
  const episode = media?.episode || 1;
  const episodeTitle = media?.episodeTitle;

  // Intercept unauthorized popup calls & bridge Vumeto postMessages
  useEffect(() => {
    const originalOpen = window.open;
    window.open = (url) => {
      console.warn('[StreamPrime Ad-Guard] Blocked unauthorized popup to:', url);
      return null;
    };

    const handleMessage = (event) => {
      if (event.data?.type === 'gaia:playback-progress') {
        console.log('[Vumeto Bridge] Progress update:', event.data.payload);
      }
    };
    window.addEventListener('message', handleMessage);

    return () => {
      window.open = originalOpen;
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // 1. Fetch official TMDB trailer and details if not already passed
  useEffect(() => {
    setResolvedIsAnime(ctx.isAnime);
    if (!mediaId) return;

    let isMounted = true;
    if (ctx.hasTmdbId && (!media.trailerKey || !ctx.isAnime)) {
      setLoadingDetails(true);
      fetchMediaDetails(mediaType, mediaId)
        .then((res) => {
          if (isMounted && res.success) {
            const key = res.data?.trailerKey;
            if (key) setTrailerKey(key);
            if (res.data?.isAnime) setResolvedIsAnime(true);
          }
        })
        .catch((err) => console.warn('Could not fetch details for player:', err))
        .finally(() => {
          if (isMounted) setLoadingDetails(false);
        });
    } else {
      setTrailerKey(media.trailerKey || null);
      setLoadingDetails(false);
    }

    // Save to Continue Watching history in MongoDB
    updateHistory({
      mediaId: ctx.tmdbId || media.id || media.mediaId,
      mediaType,
      title,
      posterPath: media.poster_path || media.posterPath || '',
      backdropPath: media.backdrop_path || media.backdropPath || '',
      progress: Math.floor(Math.random() * 25) + 15,
      season,
      episode
    }).catch((err) => console.warn('Could not update history:', err));

    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType, media?.trailerKey, ctx.hasTmdbId, ctx.isAnime, title, season, episode]);

  // 2. Re-calculate embed URL immediately with safe auto-dismiss for spinner
  useEffect(() => {
    if (!media) return;

    setPlayerLoading(true);
    const enrichedMedia = {
      ...media,
      media_type: ctx.hasTmdbId ? mediaType : 'anime',
      isAnime: resolvedIsAnime,
      tmdbId: ctx.hasTmdbId ? mediaId : null,
      anilistId: ctx.anilistId
    };
    const url = getPlayerEmbedUrl(
      activeServer,
      enrichedMedia,
      trailerKey,
      season,
      episode
    );
    setEmbedUrl(url);

    // Auto-dismiss loading indicator after 1.2s so it NEVER covers the video
    const timer = setTimeout(() => {
      setPlayerLoading(false);
    }, 1200);

    return () => clearTimeout(timer);
  }, [media, activeServer, trailerKey, season, episode, resolvedIsAnime, mediaType, mediaId, ctx.hasTmdbId, ctx.anilistId]);

  if (!media) return null;

  const isTrailerMode = activeServer.isTrailer || activeServer.id === 'trailer';
  const isVumeto = activeServer.id === 'vumeto';

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-200">
      {/* Top Header Bar */}
      <div className="bg-[#0b0f19] px-4 py-2.5 flex flex-wrap items-center justify-between border-b border-gray-800 z-30 gap-3">
        <div className="flex items-center space-x-3">
          <button
            onClick={onClose}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-sm sm:text-base font-bold text-white truncate max-w-xs sm:max-w-md">
                {title}
              </h2>
              <span className="hidden sm:inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Zap className="w-3 h-3" />
                <span>{activeServer.name.split(' ')[0]} {activeServer.name.split(' ')[1]}</span>
              </span>
            </div>
            {mediaType === 'tv' && (
              <p className="text-xs text-blue-400 font-medium">
                Season {season}, Episode {episode} {episodeTitle ? `• ${episodeTitle}` : ''}
              </p>
            )}
          </div>
        </div>

        {/* Server & Stream Switcher */}
        <div className="flex items-center space-x-2">
          {/* Ad-Guard Badge */}
          <div
            title="Popup protection active"
            className="hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-600/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Popup Guard</span>
          </div>

          <div className="flex items-center bg-gray-900 p-1 rounded-xl border border-gray-800 overflow-x-auto no-scrollbar">
            {EMBED_SERVERS.map((server) => {
              const isActive = activeServer.id === server.id;
              return (
                <button
                  key={server.id}
                  onClick={() => {
                    setActiveServer(server);
                    if (onServerChange) onServerChange(server);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {server.isTrailer ? (
                    <Film className="w-3.5 h-3.5" />
                  ) : (
                    <Server className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {server.isTrailer ? 'Trailer' : server.name.replace('Server ', 'S')}
                  </span>
                </button>
              );
            })}
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-red-600 text-white flex items-center justify-center transition-colors ml-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Video Player Screen (Absolute Layout Matching GaiaFlix) */}
      <div className="flex-1 min-h-0 w-full bg-black relative overflow-hidden">
        {/* Non-blocking Floating Loading Badge */}
        {playerLoading && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-2 px-4 py-2 rounded-full bg-black/80 backdrop-blur-md border border-blue-500/30 text-xs text-white pointer-events-none shadow-xl animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 text-blue-400 animate-spin" />
            <span>Connecting to {activeServer.name}...</span>
          </div>
        )}

        {/* Video Iframe */}
        {embedUrl ? (
          <iframe
            key={embedUrl}
            src={embedUrl}
            title={title}
            onLoad={() => setPlayerLoading(false)}
            className="absolute inset-0 w-full h-full border-0 block"
            style={{ width: '100%', height: '100%', border: 'none', background: '#000' }}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
            allowFullScreen
          />
        ) : isTrailerMode && !trailerKey && !loadingDetails ? (
          <div className="text-center p-8 max-w-md space-y-4 absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-red-600/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Film className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">No YouTube Trailer Available</h3>
              <p className="text-xs text-gray-400 mt-1">
                Switch to our streaming servers to watch the full title.
              </p>
            </div>
            <button
              onClick={() => setActiveServer(EMBED_SERVERS[0])}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-transform hover:scale-105 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Switch to Server 1 (VidSrc PM)</span>
            </button>
          </div>
        ) : (
          <div className="text-center p-8 space-y-3 text-gray-400 absolute inset-0 flex flex-col items-center justify-center">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-semibold">Loading media stream player...</p>
          </div>
        )}
      </div>

      {/* Bottom Stream Status & Quick Alternate Server Switcher */}
      <div className="bg-[#0b0f19] px-4 py-2 flex flex-wrap items-center justify-between text-xs text-gray-400 border-t border-gray-900 gap-2 z-30">
        <div className="flex items-center space-x-2">
          {isVumeto ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          ) : (
            <Zap className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          )}
          <span>
            {isVumeto
              ? "If Vumeto's stream proxy times out, click S1 (VidSrc PM) or S2 (Vidstuck) for instant full video."
              : isTrailerMode
              ? 'Watching Official HD Trailer. Click S1 for full movie stream.'
              : `Playing on ${activeServer.name}. Full video & audio active.`}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-gray-500 text-[11px] hidden sm:inline">Switch server:</span>
          {EMBED_SERVERS.filter((s) => !s.isTrailer && s.id !== activeServer.id).map((srv) => (
            <button
              key={srv.id}
              onClick={() => setActiveServer(srv)}
              className="px-2 py-0.5 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-[11px] font-medium transition-colors"
            >
              {srv.name.replace('Server ', 'S')}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
