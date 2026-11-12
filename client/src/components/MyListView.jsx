import React, { useState } from 'react';
import { Bookmark, Play, Trash2, Info, Star } from 'lucide-react';
import { getImageUrl } from '../services/api';

export default function MyListView({
  watchlist = [],
  onPlay,
  onMoreInfo,
  onToggleWatchlist,
  onBrowseTrending
}) {
  const [filter, setFilter] = useState('all');

  const filteredItems = watchlist.filter((item) => {
    if (filter === 'all') return true;
    return (item.mediaType || 'movie').toLowerCase() === filter.toLowerCase();
  });

  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white flex items-center space-x-3">
            <Bookmark className="w-8 h-8 text-blue-500 fill-current" />
            <span>My Watchlist</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Synced automatically to your guest session. No account required.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 bg-gray-900 p-1 rounded-xl border border-gray-800 self-start sm:self-auto">
          {['all', 'movie', 'tv', 'anime'].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all ${
                filter === type
                  ? 'bg-blue-600 text-white shadow'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {type === 'all' ? 'All Titles' : type === 'tv' ? 'Series' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Saved Items */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredItems.map((item) => {
            const mediaObj = {
              id: item.mediaId,
              title: item.title,
              poster_path: item.posterPath,
              backdrop_path: item.backdropPath,
              media_type: item.mediaType || 'movie',
              vote_average: item.voteAverage,
              release_date: item.releaseDate,
              overview: item.overview
            };

            return (
              <div
                key={item.mediaId}
                className="group relative rounded-2xl overflow-hidden bg-gray-900 border border-white/5 hover:border-blue-500 transition-all hover:scale-105 shadow-xl"
              >
                <div
                  className="relative aspect-[2/3] w-full cursor-pointer bg-gray-950"
                  onClick={() => onMoreInfo(mediaObj)}
                >
                  <img
                    src={getImageUrl(item.posterPath, 'w342')}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />

                  {item.voteAverage > 0 && (
                    <div className="absolute top-2 left-2 flex items-center space-x-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-amber-400">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{Number(item.voteAverage).toFixed(1)}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 bg-gray-900">
                  <h3
                    onClick={() => onMoreInfo(mediaObj)}
                    className="text-xs sm:text-sm font-bold text-white truncate cursor-pointer hover:text-blue-400"
                  >
                    {item.title}
                  </h3>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-800">
                    <button
                      onClick={() => onPlay(mediaObj)}
                      className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-white text-gray-950 font-bold text-[11px] hover:bg-blue-500 hover:text-white transition-colors"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>Watch</span>
                    </button>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onMoreInfo(mediaObj)}
                        title="Info"
                        className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-gray-300 hover:text-white"
                      >
                        <Info className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onToggleWatchlist(mediaObj)}
                        title="Remove from list"
                        className="w-7 h-7 rounded-full bg-white/5 hover:bg-red-600/20 text-gray-400 hover:text-red-400 flex items-center justify-center transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-20 text-center space-y-4 bg-gray-900/40 rounded-3xl border border-gray-800 p-8">
          <Bookmark className="w-12 h-12 text-gray-600 mx-auto" />
          <h2 className="text-xl font-bold text-white">Your List is Empty</h2>
          <p className="text-sm text-gray-400 max-w-md mx-auto">
            Click the "+" icon on any movie, television series, or anime card to bookmark it for later.
          </p>
          <button
            onClick={onBrowseTrending}
            className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-600/30"
          >
            Explore Trending Titles
          </button>
        </div>
      )}
    </div>
  );
}
