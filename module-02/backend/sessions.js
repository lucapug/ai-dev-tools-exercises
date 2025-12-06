import { nanoid } from 'nanoid';

class SessionManager {
  constructor() {
    this.sessions = new Map();
  }

  createSession() {
    const sessionId = nanoid(10);
    this.sessions.set(sessionId, {
      id: sessionId,
      code: '// Write your code here\n',
      language: 'javascript',
      participants: new Set(),
      createdAt: Date.now()
    });
    return sessionId;
  }

  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  updateCode(sessionId, code) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.code = code;
    }
  }

  updateLanguage(sessionId, language) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.language = language;
    }
  }

  addParticipant(sessionId, socketId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants.add(socketId);
    }
  }

  removeParticipant(sessionId, socketId) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.participants.delete(socketId);
      // Clean up empty sessions after 1 hour
      if (session.participants.size === 0) {
        setTimeout(() => {
          const currentSession = this.sessions.get(sessionId);
          if (currentSession && currentSession.participants.size === 0) {
            this.sessions.delete(sessionId);
          }
        }, 3600000);
      }
    }
  }

  getParticipantCount(sessionId) {
    const session = this.sessions.get(sessionId);
    return session ? session.participants.size : 0;
  }
}

export default new SessionManager();