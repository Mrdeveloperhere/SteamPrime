import React, { useState, useEffect } from 'react';
import { Play, Info, Plus, Check, Volume2, VolumeX, Star, Sparkles } from 'lucide-react';
import { getBackdropUrl, getImageUrl } from '../services/api';

export default function HeroBillboard({
  items = [],
  onPlay,
  onMoreInfo,
  watchlist = [],
  onToggleWatchlist
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  // Auto-rotate hero every 10 seconds if user is idle
  useEffect(() => {
    if (!items.length) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.min(items.length, 6));
    }, 10000);
    return () => clearInterval(interval);
  }, [items.length]);

  if (!items || items.length === 0) {
    return (
      <div className="h-[70vh] md:h-[85vh] w-full bg-gray-950 flex items-center justify-center animate-pulse">
        <div className="text-gray-500 font-medium flex items-center space-x-2">
          <Sparkles className="w-5 h-5 animate-spin text-blue-500" />
          <span>Loading featured cinema...</span>
        </div>
      </div>
    );
  }

  const media = items[currentIndex] || items[0];
  const title = media.title || media.name || 'Featured Movie';
  const year = (media.release_date || media.first_air_date || '').slice(0, 4) || '2026';
  const rating = media.vote_average ? Number(media.vote_average).toFixed(1) : '7.8';
  const isInWatchlist = watchlist.some(
    (item) => String(item.mediaId) === String(media.id)
  );

  return (
    <div className="relative h-[75vh] sm:h-[82vh] md:h-[90vh] w-full overflow-hidden select-none">
      {/* Background Cinematic Backdrop */}
      <div className="absolute inset-0">
        <img
          src={getBackdropUrl(media.backdrop_path)}
          alt={title}
          className="w-full h-full object-cover object-center transition-all duration-1000 scale-105"
        />
        {/* Cinematic Vignettes & Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080b12] via-[#080b12]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080b12]/95 via-[#080b12]/50 to-transparent" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#080b12]/40" />
      </div>

      {/* Hero Content (Netflix & Prime Layout) */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex flex-col justify-end pb-16 sm:pb-24 z-10">
        <div className="max-w-2xl space-y-4">
          {/* Badge & Rating Row */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-red-600 text-white shadow-md shadow-red-600/30">
              #1 Trending
            </span>
            <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{rating}</span>
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-white/10 text-gray-200 border border-white/10">
              {year}
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-white/10 text-gray-200 border border-white/10">
              4K UHD
            </span>
            <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-white/10 text-gray-200 border border-white/10">
              16+
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-white drop-shadow-lg leading-tight">
            {title}
          </h1>

          {/* Overview */}
          <p className="text-sm sm:text-base text-gray-300 line-clamp-3 leading-relaxed max-w-xl drop-shadow">
            {media.overview ||
              'Experience this blockbuster cinematic release with high-definition visuals, immersive spatial audio, and unforgettable storytelling.'}
          </p>

          {/* Call-to-Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onPlay(media)}
              className="flex items-center space-x-2 px-6 sm:px-8 py-3 rounded-full bg-white text-gray-950 font-bold text-sm sm:text-base hover:bg-gradient-to-r hover:from-red-600 hover:to-blue-600 hover:text-white transition-all duration-300 shadow-xl hover:scale-105 active:scale-95"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>Play Now</span>
            </button>

            <button
              onClick={() => onMoreInfo(media)}
              className="flex items-center space-x-2 px-5 sm:px-6 py-3 rounded-full bg-gray-800/80 hover:bg-gray-700 text-white font-semibold text-sm sm:text-base backdrop-blur-md border border-white/10 transition-all duration-200 hover:scale-105"
            >
              <Info className="w-5 h-5 text-gray-300" />
              <span>More Info</span>
            </button>

            <button
              onClick={() => onToggleWatchlist(media)}
              title={isInWatchlist ? 'Remove from My List' : 'Add to My List'}
              className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all duration-200 ${
                isInWatchlist
                  ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-gray-900/70 border-white/20 text-gray-200 hover:border-white hover:text-white'
              }`}
            >
              {isInWatchlist ? <Check className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              title={isMuted ? 'Unmute' : 'Mute'}
              className="w-11 h-11 rounded-full bg-gray-900/70 border border-white/20 flex items-center justify-center text-gray-300 hover:text-white hover:border-white transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Prime Video Style Thumbnail Carousel Selectors (Bottom Right) */}
      <div className="hidden lg:flex items-center space-x-3 absolute bottom-12 right-8 z-20 bg-black/40 backdrop-blur-md p-2 rounded-2xl border border-white/10">
        {items.slice(0, 5).map((item, idx) => (
          <button
            key={item.id}
            onClick={() => setCurrentIndex(idx)}
            className={`relative rounded-xl overflow-hidden transition-all duration-300 ${
              currentIndex === idx
                ? 'ring-2 ring-blue-500 scale-105 opacity-100 shadow-xl'
                : 'opacity-50 hover:opacity-80 scale-95'
            }`}
          >
            <img
              src={getImageUrl(item.backdrop_path || item.poster_path, 'w300')}
              alt={item.title || item.name}
              className="w-24 h-14 object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-1">
              <span className="text-[10px] font-bold text-white truncate w-full text-left">
                {item.title || item.name}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
