import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Session } from '../models/Session.js';

const router = express.Router();

// In-memory fallback if MongoDB is not reachable
const memorySessions = new Map();

// Helper to get or create session
async function getOrCreateSession(sessionId) {
  let id = sessionId;
  if (!id) {
    id = uuidv4();
  }

  try {
    let session = await Session.findOne({ sessionId: id });
    if (!session) {
      session = await Session.create({ sessionId: id, watchlist: [], history: [] });
    }
    return { session, id, isMongo: true };
  } catch (err) {
    console.warn('MongoDB query failed, using in-memory store:', err.message);
    let session = memorySessions.get(id);
    if (!session) {
      session = { sessionId: id, watchlist: [], history: [] };
      memorySessions.set(id, session);
    }
    return { session, id, isMongo: false };
  }
}

// Middleware to extract or generate session ID
router.use((req, res, next) => {
  let sessionId = req.headers['x-session-id'] || req.cookies?.sessionId;
  if (!sessionId) {
    sessionId = uuidv4();
    res.cookie('sessionId', sessionId, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
  }
  req.sessionId = sessionId;
  res.setHeader('x-session-id', sessionId);
  next();
});

// GET /api/session - Get current session info (watchlist & history)
router.get('/', async (req, res) => {
  try {
    const { session, id } = await getOrCreateSession(req.sessionId);
    res.json({
      success: true,
      sessionId: id,
      watchlist: session.watchlist || [],
      history: session.history || []
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/session/watchlist - Add or remove item from Watchlist
router.post('/watchlist', async (req, res) => {
  try {
    const { session, id, isMongo } = await getOrCreateSession(req.sessionId);
    const { mediaId, mediaType, title, posterPath, backdropPath, voteAverage, releaseDate, overview } = req.body;

    if (!mediaId || !title) {
      return res.status(400).json({ success: false, message: 'mediaId and title are required' });
    }

    const existingIndex = session.watchlist.findIndex(
      item => String(item.mediaId) === String(mediaId) && item.mediaType === (mediaType || 'movie')
    );

    let isAdded = false;
    if (existingIndex > -1) {
      // Remove if already exists (toggle)
      session.watchlist.splice(existingIndex, 1);
      isAdded = false;
    } else {
      session.watchlist.unshift({
        mediaId: String(mediaId),
        mediaType: mediaType || 'movie',
        title,
        posterPath: posterPath || '',
        backdropPath: backdropPath || '',
        voteAverage: voteAverage || 0,
        releaseDate: releaseDate || '',
        overview: overview || '',
        addedAt: new Date()
      });
      isAdded = true;
    }

    if (isMongo) {
      await session.save();
    } else {
      memorySessions.set(id, session);
    }

    res.json({
      success: true,
      isAdded,
      watchlist: session.watchlist
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/session/history - Record continue watching / progress
router.post('/history', async (req, res) => {
  try {
    const { session, id, isMongo } = await getOrCreateSession(req.sessionId);
    const { mediaId, mediaType, title, posterPath, backdropPath, progress, season, episode } = req.body;

    if (!mediaId || !title) {
      return res.status(400).json({ success: false, message: 'mediaId and title are required' });
    }

    const existingIndex = session.history.findIndex(
      item => String(item.mediaId) === String(mediaId) && item.mediaType === (mediaType || 'movie')
    );

    const historyItem = {
      mediaId: String(mediaId),
      mediaType: mediaType || 'movie',
      title,
      posterPath: posterPath || '',
      backdropPath: backdropPath || '',
      progress: typeof progress === 'number' ? progress : 25,
      season: season || 1,
      episode: episode || 1,
      updatedAt: new Date()
    };

    if (existingIndex > -1) {
      session.history.splice(existingIndex, 1);
    }
    session.history.unshift(historyItem);

    // Limit history to 20 items
    if (session.history.length > 20) {
      session.history = session.history.slice(0, 20);
    }

    if (isMongo) {
      await session.save();
    } else {
      memorySessions.set(id, session);
    }

    res.json({
      success: true,
      history: session.history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// DELETE /api/session/history/:mediaId - Remove item from history
router.delete('/history/:mediaId', async (req, res) => {
  try {
    const { session, id, isMongo } = await getOrCreateSession(req.sessionId);
    const { mediaId } = req.params;

    session.history = session.history.filter(item => String(item.mediaId) !== String(mediaId));

    if (isMongo) {
      await session.save();
    } else {
      memorySessions.set(id, session);
    }

    res.json({
      success: true,
      history: session.history
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
