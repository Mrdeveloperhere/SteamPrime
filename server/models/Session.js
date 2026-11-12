import mongoose from 'mongoose';

const WatchlistItemSchema = new mongoose.Schema({
  mediaId: { type: String, required: true },
  mediaType: { type: String, enum: ['movie', 'tv', 'anime'], default: 'movie' },
  title: { type: String, required: true },
  posterPath: { type: String, default: '' },
  backdropPath: { type: String, default: '' },
  voteAverage: { type: Number, default: 0 },
  releaseDate: { type: String, default: '' },
  overview: { type: String, default: '' },
  addedAt: { type: Date, default: Date.now }
});

const HistoryItemSchema = new mongoose.Schema({
  mediaId: { type: String, required: true },
  mediaType: { type: String, enum: ['movie', 'tv', 'anime'], default: 'movie' },
  title: { type: String, required: true },
  posterPath: { type: String, default: '' },
  backdropPath: { type: String, default: '' },
  progress: { type: Number, default: 10 }, // percentage 0-100
  season: { type: Number, default: 1 },
  episode: { type: Number, default: 1 },
  updatedAt: { type: Date, default: Date.now }
});

const SessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    watchlist: [WatchlistItemSchema],
    history: [HistoryItemSchema],
    preferences: {
      accentColor: { type: String, default: '#e50914' },
      theme: { type: String, default: 'dark' }
    }
  },
  { timestamps: true }
);

export const Session = mongoose.model('Session', SessionSchema);
