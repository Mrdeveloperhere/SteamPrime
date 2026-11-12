import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Film,
  Tv,
  Sparkles,
  Trophy,
  Bookmark,
  X,
  Play,
  Settings,
  User,
  Menu
} from 'lucide-react';
import { searchMedia, getImageUrl } from '../services/api';
import { EMBED_SERVERS } from '../utils/player';

export default function Navbar({
  activeTab,
  setActiveTab,
  onSelectMedia,
  watchlistCount = 0,
  currentServer,
  setCurrentServer,
  sessionId
}) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const searchRef = useRef(null);

  // Change navbar background on scroll
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debounced live search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await searchMedia(searchQuery);
        setSearchResults((res.results || []).slice(0, 7));
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close search dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems = [
    { id: 'home', label: 'Home', icon: Film },
    { id: 'movies', label: 'Movies', icon: Film },
    { id: 'tv', label: 'TV Shows', icon: Tv },
    { id: 'anime', label: 'Anime', icon: Sparkles },
    { id: 'sports', label: 'Live Sports', icon: Trophy },
    { id: 'watchlist', label: 'My List', icon: Bookmark, badge: watchlistCount }
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-[#080b12]/95 backdrop-blur-md shadow-2xl border-b border-white/5 py-3'
          : 'bg-gradient-to-b from-black/85 via-black/40 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-8">
          <button
            onClick={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center space-x-2 text-left group focus:outline-none"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-red-600 via-rose-600 to-blue-600 flex items-center justify-center shadow-lg shadow-red-600/30 group-hover:scale-105 transition-transform">
              <Play className="w-5 h-5 text-white fill-current ml-0.5" />
            </div>
            <div className="flex items-baseline">
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white font-['Bebas_Neue'] tracking-wider">
                STREAM
              </span>
              <span className="text-xl sm:text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-['Bebas_Neue'] tracking-wider">
                PRIME
              </span>
            </div>
          </button>

          {/* Desktop Nav Tabs (Netflix & Prime Hybrid) */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 flex items-center space-x-1.5 ${
                    isActive
                      ? 'bg-white/15 text-white shadow-sm backdrop-blur-sm'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 text-[11px] font-bold rounded-full bg-red-600 text-white">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Action Tools: Search, Server Switcher, Session Info */}
        <div className="flex items-center space-x-3">
          {/* Live Search Bar */}
          <div ref={searchRef} className="relative">
            <div
              className={`flex items-center bg-gray-900/80 border rounded-full transition-all duration-300 ${
                searchOpen || searchQuery
                  ? 'w-48 sm:w-64 border-blue-500/60 shadow-lg shadow-blue-500/10'
                  : 'w-10 border-transparent hover:border-white/20'
              }`}
            >
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="w-10 h-10 flex items-center justify-center text-gray-300 hover:text-white focus:outline-none"
                aria-label="Search"
              >
                <Search className="w-4 h-4" />
              </button>
              {(searchOpen || searchQuery) && (
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Titles, people, genres..."
                  autoFocus
                  className="w-full bg-transparent text-sm text-white focus:outline-none pr-3 placeholder-gray-400"
                />
              )}
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="pr-3 text-gray-400 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Instant Search Results Dropdown */}
            {searchResults.length > 0 && (
              <div className="absolute right-0 mt-2 w-72 sm:w-84 bg-[#111827] border border-gray-700/80 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-2 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider flex justify-between">
                  <span>Search Results</span>
                  {isSearching && <span className="text-blue-400 animate-pulse">Searching...</span>}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-800/60">
                  {searchResults.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectMedia(item);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="w-full text-left p-2.5 flex items-center space-x-3 hover:bg-gray-800/80 transition-colors group"
                    >
                      <img
                        src={getImageUrl(item.poster_path, 'w92')}
                        alt={item.title || item.name}
                        className="w-11 h-15 object-cover rounded-md flex-shrink-0 bg-gray-800"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate group-hover:text-blue-400">
                          {item.title || item.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-400 mt-0.5">
                          <span className="capitalize px-1.5 py-0.5 bg-gray-800 rounded text-[10px]">
                            {item.media_type || 'movie'}
                          </span>
                          <span>{(item.release_date || item.first_air_date || '').slice(0, 4)}</span>
                          {item.vote_average > 0 && (
                            <span className="text-amber-400 font-medium">
                              ★ {Number(item.vote_average).toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Player Server Settings Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              title="Streaming Server Settings"
              className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 hover:text-white transition-colors"
            >
              <Settings className="w-4 h-4" />
            </button>
            {settingsOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-[#111827] border border-gray-700/80 rounded-2xl shadow-2xl p-3 z-50">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                  Stream Player Source
                </p>
                <div className="space-y-1">
                  {EMBED_SERVERS.map((server) => (
                    <button
                      key={server.id}
                      onClick={() => {
                        setCurrentServer(server);
                        setSettingsOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        currentServer.id === server.id
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`}
                    >
                      <span>{server.name}</span>
                      {currentServer.id === server.id && (
                        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Session Profile Pill (No Account Needed / Session-Based) */}
          <div
            title={`Session ID: ${sessionId}`}
            className="hidden sm:flex items-center space-x-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full text-xs text-gray-300 backdrop-blur-sm"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <User className="w-3.5 h-3.5 text-gray-400" />
            <span className="font-medium">Guest Session</span>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-gray-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#0a0e17] border-b border-gray-800 px-4 pt-3 pb-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-red-600 text-white' : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-white text-black">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
