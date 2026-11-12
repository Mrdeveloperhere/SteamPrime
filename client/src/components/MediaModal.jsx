import React, { useState, useEffect } from 'react';
import { X, Play, Plus, Check, Star, Clock, Calendar, Users, Film, ChevronDown } from 'lucide-react';
import {
  fetchMediaDetails,
  fetchSeasonEpisodes,
  getBackdropUrl,
  getImageUrl
} from '../services/api';
import { resolveMediaContext } from '../utils/player';

export default function MediaModal({
  media,
  onClose,
  onPlay,
  watchlist = [],
  onToggleWatchlist
}) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodes, setEpisodes] = useState([]);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);

  const ctx = resolveMediaContext(media || {});
  const mediaType = ctx.type;
  const mediaId = ctx.tmdbId;

  // Fetch full media details
  useEffect(() => {
    if (!mediaId || !ctx.hasTmdbId) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchMediaDetails(mediaType, mediaId)
      .then((res) => {
        if (isMounted && res.success) {
          setDetails(res.data);
          if (res.data.seasons && res.data.seasons.length > 0) {
            const firstSeason = res.data.seasons.find((s) => s.season_number > 0) || res.data.seasons[0];
            setSelectedSeason(firstSeason.season_number);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to load details:', err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType, ctx.hasTmdbId]);

  // Fetch episodes when selected season changes
  useEffect(() => {
    if (mediaType !== 'tv' || !mediaId || !selectedSeason || !ctx.hasTmdbId) return;

    let isMounted = true;
    setLoadingEpisodes(true);

    fetchSeasonEpisodes(mediaId, selectedSeason)
      .then((res) => {
        if (isMounted && res.success) {
          setEpisodes(res.episodes || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load episodes:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingEpisodes(false);
      });

    return () => {
      isMounted = false;
    };
  }, [mediaId, mediaType, selectedSeason, ctx.hasTmdbId]);

  if (!media) return null;

  const title = details?.title || details?.name || media.title || media.name;
  const rating = details?.vote_average || media.vote_average || 7.5;
  const year = (details?.release_date || details?.first_air_date || media.release_date || '').slice(0, 4);
  const runtime = details?.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : null;
  const seasonsCount = details?.number_of_seasons ? `${details.number_of_seasons} Season${details.number_of_seasons > 1 ? 's' : ''}` : null;
  const isInWatchlist = watchlist.some((w) => String(w.mediaId) === String(mediaId));
  const cast = details?.credits?.cast?.slice(0, 6) || [];
  const recommendations = details?.recommendations?.results?.slice(0, 6) || details?.similar?.results?.slice(0, 6) || [];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-[#0f141f] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center transition-colors border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header Banner */}
        <div className="relative aspect-video sm:h-[420px] w-full overflow-hidden bg-gray-950">
          <img
            src={getBackdropUrl(details?.backdrop_path || media.backdrop_path)}
            alt={title}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f141f] via-[#0f141f]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0f141f]/80 via-transparent to-transparent" />

          {/* Banner Title & Quick Play Overlay */}
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white drop-shadow-lg">
              {title}
            </h2>

            <div className="flex items-center space-x-3 mt-4">
              <button
                onClick={() => {
                  onPlay({
                    ...media,
                    media_type: mediaType,
                    isAnime: Boolean(details?.isAnime || ctx.isAnime),
                    tmdbId: details?.tmdbId || ctx.tmdbId,
                    anilistId: ctx.anilistId,
                    genres: details?.genres || media.genres,
                    original_language: details?.original_language || media.original_language,
                    trailerKey: details?.trailerKey,
                    season: selectedSeason,
                    episode: 1
                  });
                }}
                className="flex items-center space-x-2 px-6 py-2.5 rounded-full bg-white text-gray-950 font-bold hover:bg-gradient-to-r hover:from-red-600 hover:to-blue-600 hover:text-white transition-all shadow-xl hover:scale-105 active:scale-95"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>Play</span>
              </button>

              <button
                onClick={() => onToggleWatchlist(media)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-full border text-sm font-semibold transition-colors ${
                  isInWatchlist
                    ? 'bg-blue-600 border-blue-500 text-white'
                    : 'bg-gray-800/80 border-white/20 text-gray-200 hover:border-white'
                }`}
              >
                {isInWatchlist ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                <span>{isInWatchlist ? 'In Watchlist' : 'Add to List'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
            <span className="flex items-center space-x-1 text-amber-400 font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              <Star className="w-4 h-4 fill-current" />
              <span>{Number(rating).toFixed(1)} Rating</span>
            </span>

            {year && (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{year}</span>
              </span>
            )}

            {(runtime || seasonsCount) && (
              <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{runtime || seasonsCount}</span>
              </span>
            )}

            <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
              Ultra HD
            </span>

            {details?.genres?.map((g) => (
              <span
                key={g.id}
                className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/5 border border-white/10 text-gray-300"
              >
                {g.name}
              </span>
            ))}
          </div>

          {/* Overview */}
          <div className="space-y-2">
            <h3 className="text-base font-bold text-white uppercase tracking-wider text-xs">
              Synopsis
            </h3>
            <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
              {details?.overview || media.overview || 'No synopsis available for this title.'}
            </p>
          </div>

          {/* Cast Members */}
          {cast.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Users className="w-4 h-4 text-blue-400" />
                <span>Top Cast</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {cast.map((actor) => (
                  <div key={actor.id} className="text-center group">
                    <img
                      src={getImageUrl(actor.profile_path, 'w185')}
                      alt={actor.name}
                      className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-full mx-auto border-2 border-white/10 group-hover:border-blue-500 transition-colors bg-gray-800"
                    />
                    <p className="text-xs font-semibold text-white mt-2 truncate">{actor.name}</p>
                    <p className="text-[11px] text-gray-400 truncate">{actor.character}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TV Series Season & Episode Selector */}
          {mediaType === 'tv' && details?.seasons && details.seasons.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Film className="w-5 h-5 text-red-500" />
                  <span>Episodes</span>
                </h3>

                {/* Season Dropdown */}
                <div className="relative">
                  <select
                    value={selectedSeason}
                    onChange={(e) => setSelectedSeason(Number(e.target.value))}
                    className="bg-gray-800 text-white text-sm font-semibold py-2 px-4 pr-8 rounded-xl border border-gray-700 focus:outline-none focus:border-blue-500 cursor-pointer appearance-none"
                  >
                    {details.seasons
                      .filter((s) => s.season_number > 0)
                      .map((s) => (
                        <option key={s.id} value={s.season_number}>
                          {s.name} ({s.episode_count} Episodes)
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Episodes List */}
              {loadingEpisodes ? (
                <div className="py-8 text-center text-gray-400 text-sm animate-pulse">
                  Loading episode guide...
                </div>
              ) : episodes.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto pr-2 divide-y divide-gray-800/60">
                  {episodes.map((ep) => (
                    <div
                      key={ep.id}
                      onClick={() => {
                        onPlay({
                          ...media,
                          media_type: mediaType,
                          isAnime: Boolean(details?.isAnime || ctx.isAnime),
                          tmdbId: details?.tmdbId || ctx.tmdbId,
                          anilistId: ctx.anilistId,
                          genres: details?.genres || media.genres,
                          original_language: details?.original_language || media.original_language,
                          trailerKey: details?.trailerKey,
                          season: selectedSeason,
                          episode: ep.episode_number,
                          episodeTitle: ep.name
                        });
                      }}
                      className="p-3 rounded-2xl hover:bg-gray-800/60 transition-colors flex items-center space-x-4 cursor-pointer group"
                    >
                      <span className="text-xl font-bold text-gray-500 group-hover:text-blue-400 w-6 text-center">
                        {ep.episode_number}
                      </span>
                      <div className="relative w-28 sm:w-36 aspect-video rounded-xl overflow-hidden bg-gray-900 flex-shrink-0">
                        <img
                          src={getImageUrl(ep.still_path, 'w300')}
                          alt={ep.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white fill-current" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-white group-hover:text-blue-400 truncate">
                            {ep.name}
                          </p>
                          {ep.runtime && (
                            <span className="text-xs text-gray-400 ml-2">{ep.runtime}m</span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                          {ep.overview || 'Episode summary coming soon.'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No episodes available for this season.</p>
              )}
            </div>
          )}

          {/* More Like This (Recommendations) */}
          {recommendations.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-gray-800">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                More Like This
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    onClick={() => {
                      setDetails(null);
                      setEpisodes([]);
                      fetchMediaDetails(rec.media_type || mediaType, rec.id).then((r) => {
                        if (r.success) setDetails(r.data);
                      });
                    }}
                    className="group cursor-pointer rounded-xl overflow-hidden bg-gray-900 border border-white/5 hover:border-blue-500 transition-all hover:scale-105"
                  >
                    <img
                      src={getImageUrl(rec.poster_path, 'w342')}
                      alt={rec.title || rec.name}
                      className="aspect-[2/3] w-full object-cover"
                    />
                    <div className="p-2">
                      <p className="text-xs font-semibold text-white truncate group-hover:text-blue-400">
                        {rec.title || rec.name}
                      </p>
                      <p className="text-[10px] text-amber-400 font-bold mt-0.5">
                        ★ {Number(rec.vote_average || 7).toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
