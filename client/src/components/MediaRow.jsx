import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Play, Plus, Check, Info, Star, Trash2 } from 'lucide-react';
import { getImageUrl } from '../services/api';

export default function MediaRow({
  title,
  subtitle,
  items = [],
  onPlay,
  onMoreInfo,
  watchlist = [],
  onToggleWatchlist,
  isContinueWatching = false,
  onRemoveHistory
}) {
  const rowRef = useRef(null);

  const scroll = (direction) => {
    if (rowRef.current) {
      const { scrollLeft, clientWidth } = rowRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      rowRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <section className="py-4 md:py-6 relative group/row">
      {/* Row Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-3 flex items-baseline justify-between">
        <div>
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight flex items-center space-x-2">
            <span>{title}</span>
          </h2>
          {subtitle && <p className="text-xs sm:text-sm text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {/* Row Slider Container */}
      <div className="relative">
        {/* Left Arrow Button */}
        <button
          onClick={() => scroll('left')}
          className="absolute left-1 sm:left-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl border border-white/10 hover:scale-110 active:scale-95"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Horizontal Scroll Area */}
        <div
          ref={rowRef}
          className="flex items-center space-x-3 sm:space-x-4 overflow-x-auto no-scrollbar px-4 sm:px-6 lg:px-8 py-3 scroll-smooth"
        >
          {items.map((media) => {
            const mediaId = media.id || media.mediaId;
            const mediaTitle = media.title || media.name || 'Untitled';
            const poster = media.poster_path || media.posterPath;
            const rating = media.vote_average || media.voteAverage;
            const year = (media.release_date || media.first_air_date || media.releaseDate || '').slice(0, 4);
            const isInWatchlist = watchlist.some((w) => String(w.mediaId) === String(mediaId));

            return (
              <div
                key={`${mediaId}-${media.media_type || 'item'}`}
                className="flex-shrink-0 w-36 sm:w-44 md:w-52 group/card relative rounded-2xl overflow-hidden bg-gray-900 border border-white/5 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-red-600/10 hover:border-blue-500/50 cursor-pointer"
              >
                {/* Poster Artwork */}
                <div
                  className="relative aspect-[2/3] w-full overflow-hidden bg-gray-950"
                  onClick={() => onMoreInfo(media)}
                >
                  <img
                    src={getImageUrl(poster, 'w342')}
                    alt={mediaTitle}
                    loading="lazy"
                    className="w-full h-full object-cover object-center transition-transform duration-500 group-hover/card:scale-110"
                  />

                  {/* Gradient bottom overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80 group-hover/card:opacity-90" />

                  {/* Rating Badge (Top Left) */}
                  {rating > 0 && (
                    <div className="absolute top-2 left-2 z-10 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[11px] font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{Number(rating).toFixed(1)}</span>
                    </div>
                  )}

                  {/* Continue Watching Progress Bar */}
                  {isContinueWatching && media.progress && (
                    <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-800">
                      <div
                        className="h-full bg-gradient-to-r from-red-600 to-blue-500 rounded-r"
                        style={{ width: `${media.progress}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Card Info & Quick Actions */}
                <div className="p-3 bg-gradient-to-b from-gray-900 to-gray-950">
                  <h3
                    onClick={() => onMoreInfo(media)}
                    className="text-xs sm:text-sm font-bold text-white truncate hover:text-blue-400 transition-colors"
                  >
                    {mediaTitle}
                  </h3>

                  <div className="flex items-center justify-between mt-1 text-[11px] text-gray-400">
                    <span>{year || '2026'}</span>
                    <span className="capitalize px-1.5 py-0.5 rounded bg-white/5 border border-white/5 text-[10px]">
                      {media.media_type || 'Movie'}
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                    <button
                      onClick={() => onPlay(media)}
                      className="flex items-center space-x-1 px-3 py-1 rounded-full bg-white text-gray-950 font-bold text-xs hover:bg-blue-500 hover:text-white transition-colors"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>Play</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onToggleWatchlist(media)}
                        title={isInWatchlist ? 'Remove from List' : 'Add to List'}
                        className={`w-7 h-7 rounded-full flex items-center justify-center border transition-colors ${
                          isInWatchlist
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:border-white'
                        }`}
                      >
                        {isInWatchlist ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      </button>

                      {isContinueWatching && onRemoveHistory && (
                        <button
                          onClick={() => onRemoveHistory(mediaId)}
                          title="Remove from history"
                          className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-red-400 hover:border-red-400/40 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => onMoreInfo(media)}
                        title="Details"
                        className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-300 hover:text-white hover:border-white transition-colors"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          onClick={() => scroll('right')}
          className="absolute right-1 sm:right-3 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-black/70 hover:bg-red-600 text-white flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-all duration-300 shadow-xl border border-white/10 hover:scale-110 active:scale-95"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>
    </section>
  );
}
