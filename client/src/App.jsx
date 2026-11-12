import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroBillboard from './components/HeroBillboard';
import MediaRow from './components/MediaRow';
import MediaModal from './components/MediaModal';
import PlayerModal from './components/PlayerModal';
import SportsSection from './components/SportsSection';
import MyListView from './components/MyListView';

import {
  fetchTrending,
  fetchPopularMovies,
  fetchTopRatedMovies,
  fetchMoviesByGenre,
  fetchPopularTV,
  fetchTopRatedTV,
  fetchTrendingAnime,
  fetchSession,
  toggleWatchlist,
  removeHistory,
  getSessionId
} from './services/api';
import { EMBED_SERVERS } from './utils/player';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [currentServer, setCurrentServer] = useState(EMBED_SERVERS[0]); // default: Official Trailer

  // Catalog States
  const [trending, setTrending] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRatedMovies, setTopRatedMovies] = useState([]);
  const [actionMovies, setActionMovies] = useState([]);
  const [sciFiMovies, setSciFiMovies] = useState([]);
  const [popularTV, setPopularTV] = useState([]);
  const [topRatedTV, setTopRatedTV] = useState([]);
  const [anime, setAnime] = useState([]);

  // Session State (No Account Needed / Session-based)
  const [session, setSession] = useState({ sessionId: getSessionId(), watchlist: [], history: [] });

  // Modals
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [playingMedia, setPlayingMedia] = useState(null);

  // Initial Data Fetching
  useEffect(() => {
    // 1. Fetch Session from MongoDB/Backend
    fetchSession()
      .then((res) => {
        if (res.success) {
          setSession(res);
        }
      })
      .catch((err) => console.warn('Session load warning:', err.message));

    // 2. Fetch TMDB Catalogs
    fetchTrending()
      .then((res) => res.success && setTrending(res.results || []))
      .catch((e) => console.error(e));

    fetchPopularMovies()
      .then((res) => res.success && setPopularMovies(res.results || []))
      .catch((e) => console.error(e));

    fetchTopRatedMovies()
      .then((res) => res.success && setTopRatedMovies(res.results || []))
      .catch((e) => console.error(e));

    fetchMoviesByGenre(28) // Action
      .then((res) => res.success && setActionMovies(res.results || []))
      .catch((e) => console.error(e));

    fetchMoviesByGenre(878) // Sci-Fi
      .then((res) => res.success && setSciFiMovies(res.results || []))
      .catch((e) => console.error(e));

    fetchPopularTV()
      .then((res) => res.success && setPopularTV(res.results || []))
      .catch((e) => console.error(e));

    fetchTopRatedTV()
      .then((res) => res.success && setTopRatedTV(res.results || []))
      .catch((e) => console.error(e));

    // 3. Fetch AniList Anime
    fetchTrendingAnime()
      .then((res) => res.success && setAnime(res.results || []))
      .catch((e) => console.error(e));
  }, []);

  // Handle Watchlist Toggle
  const handleToggleWatchlist = async (media) => {
    const mediaId = media.id || media.mediaId;
    const mediaType = media.media_type || 'movie';
    const title = media.title || media.name || 'Untitled';
    const posterPath = media.poster_path || media.posterPath || '';
    const backdropPath = media.backdrop_path || media.backdropPath || '';
    const voteAverage = media.vote_average || media.voteAverage || 0;
    const releaseDate = media.release_date || media.first_air_date || media.releaseDate || '';
    const overview = media.overview || '';

    // Optimistic UI update
    const exists = session.watchlist.some((w) => String(w.mediaId) === String(mediaId));
    let updatedList;
    if (exists) {
      updatedList = session.watchlist.filter((w) => String(w.mediaId) !== String(mediaId));
    } else {
      updatedList = [
        { mediaId, mediaType, title, posterPath, backdropPath, voteAverage, releaseDate, overview },
        ...session.watchlist
      ];
    }
    setSession((prev) => ({ ...prev, watchlist: updatedList }));

    try {
      const res = await toggleWatchlist({
        mediaId,
        mediaType,
        title,
        posterPath,
        backdropPath,
        voteAverage,
        releaseDate,
        overview
      });
      if (res.success) {
        setSession((prev) => ({ ...prev, watchlist: res.watchlist }));
      }
    } catch (err) {
      console.error('Watchlist toggle error:', err);
    }
  };

  // Handle Remove from History
  const handleRemoveHistory = async (mediaId) => {
    setSession((prev) => ({
      ...prev,
      history: prev.history.filter((h) => String(h.mediaId) !== String(mediaId))
    }));
    try {
      await removeHistory(mediaId);
    } catch (err) {
      console.error('Remove history error:', err);
    }
  };

  // Quick Play handler
  const handlePlay = (media) => {
    setPlayingMedia(media);
  };

  // More Info handler
  const handleMoreInfo = (media) => {
    setSelectedMedia(media);
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-gray-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSelectMedia={handleMoreInfo}
        watchlistCount={session.watchlist.length}
        currentServer={currentServer}
        setCurrentServer={setCurrentServer}
        sessionId={session.sessionId}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* 1. HOME TAB */}
        {activeTab === 'home' && (
          <div>
            <HeroBillboard
              items={trending}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              watchlist={session.watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />

            <div className="relative -mt-16 sm:-mt-24 z-20 space-y-2 pb-16">
              {/* Continue Watching Row (Session-based) */}
              {session.history.length > 0 && (
                <MediaRow
                  title="Continue Watching"
                  subtitle="Resume from where you left off"
                  items={session.history}
                  onPlay={handlePlay}
                  onMoreInfo={handleMoreInfo}
                  watchlist={session.watchlist}
                  onToggleWatchlist={handleToggleWatchlist}
                  isContinueWatching={true}
                  onRemoveHistory={handleRemoveHistory}
                />
              )}

              {/* Trending Now */}
              <MediaRow
                title="Trending Today"
                subtitle="Most watched movies and television across all services"
                items={trending}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Popular Movies */}
              <MediaRow
                title="Popular Movies"
                subtitle="Top rated theatrical and streaming hits"
                items={popularMovies}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Critically Acclaimed TV */}
              <MediaRow
                title="Bingeworthy TV Series"
                subtitle="Addictive dramas, comedies, and limited series"
                items={popularTV}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* High Octane Action */}
              <MediaRow
                title="High-Octane Action & Thrillers"
                subtitle="Adrenaline-pumping blockbusters"
                items={actionMovies}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Sci-Fi */}
              <MediaRow
                title="Sci-Fi & Cyberpunk Worlds"
                subtitle="Mind-bending adventures and futuristic epics"
                items={sciFiMovies}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />

              {/* Trending Anime */}
              <MediaRow
                title="Trending Anime (AniList)"
                subtitle="Direct from Japan with original Japanese audio"
                items={anime}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>
          </div>
        )}

        {/* 2. MOVIES TAB */}
        {activeTab === 'movies' && (
          <div>
            <HeroBillboard
              items={popularMovies}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              watchlist={session.watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <div className="relative -mt-16 sm:-mt-24 z-20 space-y-2 pb-16">
              <MediaRow
                title="Top Rated Movies of All Time"
                items={topRatedMovies}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
              <MediaRow
                title="Popular Theatrical Releases"
                items={popularMovies}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
              <MediaRow
                title="Action & Adventure"
                items={actionMovies}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
              <MediaRow
                title="Sci-Fi & Fantasy"
                items={sciFiMovies}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>
          </div>
        )}

        {/* 3. TV SERIES TAB */}
        {activeTab === 'tv' && (
          <div>
            <HeroBillboard
              items={popularTV}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              watchlist={session.watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <div className="relative -mt-16 sm:-mt-24 z-20 space-y-2 pb-16">
              <MediaRow
                title="Popular TV Series"
                items={popularTV}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
              <MediaRow
                title="Critically Acclaimed TV Shows"
                items={topRatedTV}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>
          </div>
        )}

        {/* 4. ANIME TAB */}
        {activeTab === 'anime' && (
          <div>
            <HeroBillboard
              items={anime}
              onPlay={handlePlay}
              onMoreInfo={handleMoreInfo}
              watchlist={session.watchlist}
              onToggleWatchlist={handleToggleWatchlist}
            />
            <div className="relative -mt-16 sm:-mt-24 z-20 space-y-2 pb-16">
              <MediaRow
                title="Trending Japanese Anime"
                subtitle="Synced from AniList GraphQL Catalog"
                items={anime}
                onPlay={handlePlay}
                onMoreInfo={handleMoreInfo}
                watchlist={session.watchlist}
                onToggleWatchlist={handleToggleWatchlist}
              />
            </div>
          </div>
        )}

        {/* 5. LIVE SPORTS TAB */}
        {activeTab === 'sports' && <SportsSection />}

        {/* 6. WATCHLIST TAB */}
        {activeTab === 'watchlist' && (
          <MyListView
            watchlist={session.watchlist}
            onPlay={handlePlay}
            onMoreInfo={handleMoreInfo}
            onToggleWatchlist={handleToggleWatchlist}
            onBrowseTrending={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* Media Details Modal */}
      {selectedMedia && (
        <MediaModal
          media={selectedMedia}
          onClose={() => setSelectedMedia(null)}
          onPlay={handlePlay}
          watchlist={session.watchlist}
          onToggleWatchlist={handleToggleWatchlist}
        />
      )}

      {/* Theater Video Player Modal */}
      {playingMedia && (
        <PlayerModal
          media={playingMedia}
          onClose={() => setPlayingMedia(null)}
          initialServer={currentServer}
          onServerChange={setCurrentServer}
        />
      )}

      {/* Cinematic Footer */}
      <footer className="bg-black/90 border-t border-gray-900 py-10 px-4 sm:px-6 lg:px-8 text-center sm:text-left">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center space-x-2 justify-center sm:justify-start">
              <span className="text-xl font-black text-white font-['Bebas_Neue'] tracking-wider">
                STREAM
              </span>
              <span className="text-xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-['Bebas_Neue'] tracking-wider">
                PRIME
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Netflix & Amazon Prime Video hybrid UI/UX experience. Powered by MERN Stack.
            </p>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-end gap-4 text-xs text-gray-400">
            <span>Powered by TMDB API</span>
            <span>•</span>
            <span>AniList GraphQL</span>
            <span>•</span>
            <span>BinTV Sports</span>
            <span>•</span>
            <span>Session: {session.sessionId.slice(0, 14)}...</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
