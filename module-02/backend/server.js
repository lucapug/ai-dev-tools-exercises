import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import sessionManager from './sessions.js';

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      process.env.FRONTEND_URL || "http://localhost:5173"
    ],
    methods: ["GET", "POST"]
  }
});

// REST API endpoints
app.post('/api/sessions', (req, res) => {
  const sessionId = sessionManager.createSession();
  res.json({ sessionId, url: `${req.protocol}://${req.get('host')}/session/${sessionId}` });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = sessionManager.getSession(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json({
    id: session.id,
    code: session.code,
    language: session.language,
    participantCount: session.participants.size
  });
});

// Socket.IO for real-time collaboration
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-session', (sessionId) => {
    const session = sessionManager.getSession(sessionId);
    
    if (!session) {
      socket.emit('session-error', 'Session not found');
      return;
    }

    socket.join(sessionId);
    sessionManager.addParticipant(sessionId, socket.id);
    
    // Send current session state to the new participant
    socket.emit('session-joined', {
      code: session.code,
      language: session.language,
      participantCount: sessionManager.getParticipantCount(sessionId)
    });

    // Notify all participants about the new user
    io.to(sessionId).emit('participant-count', 
      sessionManager.getParticipantCount(sessionId)
    );

    console.log(`User ${socket.id} joined session ${sessionId}`);
  });

  socket.on('code-change', ({ sessionId, code }) => {
    sessionManager.updateCode(sessionId, code);
    // Broadcast to all other participants in the session
    socket.to(sessionId).emit('code-update', code);
  });

  socket.on('language-change', ({ sessionId, language }) => {
    sessionManager.updateLanguage(sessionId, language);
    // Update code template when language changes
    const defaultCode = sessionManager.getDefaultCode(language);
    sessionManager.updateCode(sessionId, defaultCode);
    // Broadcast to all participants in the session
    io.to(sessionId).emit('language-update', language);
    io.to(sessionId).emit('code-update', defaultCode);
  });

  socket.on('cursor-change', ({ sessionId, position }) => {
    // Broadcast cursor position to other participants
    socket.to(sessionId).emit('cursor-update', {
      socketId: socket.id,
      position
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Remove participant from all sessions
    sessionManager.sessions.forEach((session, sessionId) => {
      if (session.participants.has(socket.id)) {
        sessionManager.removeParticipant(sessionId, socket.id);
        io.to(sessionId).emit('participant-count', 
          sessionManager.getParticipantCount(sessionId)
        );
      }
    });
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});