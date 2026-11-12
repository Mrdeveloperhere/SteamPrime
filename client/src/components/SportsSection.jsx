import React, { useState, useEffect } from 'react';
import { Trophy, Play, Radio, Calendar, ExternalLink, Activity } from 'lucide-react';
import { fetchLiveSports } from '../services/api';

export default function SportsSection() {
  const [sportsData, setSportsData] = useState({ live: [], upcoming: [], channels: [] });
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let isMounted = true;
    fetchLiveSports()
      .then((res) => {
        if (isMounted && res.success) {
          setSportsData(res);
        }
      })
      .catch((err) => console.error('Sports error:', err))
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ['all', 'Football', 'Basketball', 'MMA', 'Tennis', 'Motorsport'];

  const filteredLive = sportsData.live.filter((event) => {
    if (selectedCategory === 'all') return true;
    return (event.category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  const filteredUpcoming = sportsData.upcoming.filter((event) => {
    if (selectedCategory === 'all') return true;
    return (event.category || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  return (
    <div className="pt-24 pb-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 animate-in fade-in duration-300">
      {/* Sports Banner Header */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-950 via-slate-900 to-red-950 p-6 sm:p-10 border border-blue-500/20 shadow-2xl">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <span className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-red-600/30 text-red-400 border border-red-500/40 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
              <span>Live Broadcasts</span>
            </span>
            <span className="text-xs text-gray-300 font-medium">BinTV Sports Network</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Live Stadium & Tournaments
          </h1>

          <p className="text-sm sm:text-base text-gray-300">
            Stream premier league matches, NBA basketball, combat sports, tennis championships, and grand prix races in real-time.
          </p>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar py-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 scale-105'
                : 'bg-white/5 border border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Live Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <span>Happening Right Now</span>
          </h2>
          <span className="text-xs text-gray-400 font-medium">
            {filteredLive.length} Events Streaming
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-gray-900 animate-pulse border border-gray-800" />
            ))}
          </div>
        ) : filteredLive.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredLive.map((event, idx) => {
              const streamUrl = event.streams?.[0]?.url || 'https://bintv-sources.pages.dev';
              return (
                <div
                  key={event.id || idx}
                  className="rounded-2xl overflow-hidden bg-gradient-to-b from-gray-900 to-gray-950 border border-gray-800 hover:border-blue-500/60 transition-all duration-300 hover:scale-[1.02] shadow-xl group"
                >
                  <div className="relative h-40 w-full overflow-hidden bg-gray-900">
                    <img
                      src={event.poster || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80'}
                      alt={event.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />

                    <div className="absolute top-3 left-3 flex items-center space-x-2">
                      <span className="flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-red-600 text-white text-[11px] font-black uppercase tracking-wider shadow-lg">
                        <Activity className="w-3 h-3 animate-bounce" />
                        <span>LIVE</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                        {event.category || 'Sport'}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-3">
                    <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                      {event.name}
                    </h3>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                      <span className="text-xs text-gray-400 font-medium">
                        Feed: {event.streams?.[0]?.name || 'HD Main'}
                      </span>
                      <a
                        href={streamUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-lg shadow-blue-600/30"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Watch Feed</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-gray-900/50 rounded-2xl border border-gray-800 text-gray-400">
            No live events currently streaming in this category. Check upcoming fixtures below!
          </div>
        )}
      </div>

      {/* Upcoming Fixtures */}
      {filteredUpcoming.length > 0 && (
        <div className="space-y-4 pt-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>Upcoming Fixtures</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUpcoming.map((event, idx) => (
              <div
                key={event.id || idx}
                className="p-4 rounded-2xl bg-gray-900/80 border border-gray-800 flex items-center space-x-4"
              >
                <div className="w-16 h-16 rounded-xl bg-gray-800 overflow-hidden flex-shrink-0">
                  <img
                    src={event.poster || 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80'}
                    alt={event.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                    {event.category || 'Match'}
                  </span>
                  <p className="text-sm font-bold text-white truncate">{event.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{event.status || 'Scheduled'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
