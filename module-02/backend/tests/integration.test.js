import { describe, test, expect, beforeAll, afterAll, afterEach } from '@jest/globals';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import sessionManager from '../sessions.js';
import { createSocketClient, waitForSocketEvent, disconnectSocket, sleep } from './helpers.js';

let app;
let httpServer;
let io;
let serverPort;

// Setup test server
beforeAll((done) => {
  app = express();
  app.use(cors());
  app.use(express.json());
  httpServer = createServer(app);
  
  io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // REST API endpoints
  app.post('/api/sessions', (req, res) => {
    const sessionId = sessionManager.createSession();
    res.json({ sessionId, url: `http://localhost:${serverPort}/session/${sessionId}` });
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

  // Socket.IO handlers
  io.on('connection', (socket) => {
    socket.on('join-session', (sessionId) => {
      const session = sessionManager.getSession(sessionId);
      
      if (!session) {
        socket.emit('session-error', 'Session not found');
        return;
      }

      socket.join(sessionId);
      sessionManager.addParticipant(sessionId, socket.id);
      
      socket.emit('session-joined', {
        code: session.code,
        language: session.language,
        participantCount: sessionManager.getParticipantCount(sessionId)
      });

      io.to(sessionId).emit('participant-count', 
        sessionManager.getParticipantCount(sessionId)
      );
    });

    socket.on('code-change', ({ sessionId, code }) => {
      sessionManager.updateCode(sessionId, code);
      socket.to(sessionId).emit('code-update', code);
    });

    socket.on('language-change', ({ sessionId, language }) => {
      sessionManager.updateLanguage(sessionId, language);
      io.to(sessionId).emit('language-update', language);
    });

    socket.on('cursor-change', ({ sessionId, position }) => {
      socket.to(sessionId).emit('cursor-update', {
        socketId: socket.id,
        position
      });
    });

    socket.on('disconnect', () => {
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

  // Start server on random available port
  httpServer.listen(0, () => {
    serverPort = httpServer.address().port;
    done();
  });
});

afterAll((done) => {
  io.close();
  httpServer.close(done);
});

afterEach(() => {
  // Clear all sessions after each test
  sessionManager.sessions.clear();
});

describe('REST API Integration Tests', () => {
  test('POST /api/sessions - should create a new session', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .expect(200);

    expect(response.body).toHaveProperty('sessionId');
    expect(response.body).toHaveProperty('url');
    expect(response.body.sessionId).toHaveLength(10);
    expect(response.body.url).toContain(response.body.sessionId);
  });

  test('GET /api/sessions/:sessionId - should retrieve session details', async () => {
    // Create a session first
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Retrieve session
    const response = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .expect(200);

    expect(response.body).toEqual({
      id: sessionId,
      code: '// Write your code here\n',
      language: 'javascript',
      participantCount: 0
    });
  });

  test('GET /api/sessions/:sessionId - should return 404 for non-existent session', async () => {
    const response = await request(app)
      .get('/api/sessions/nonexistent')
      .expect(404);

    expect(response.body).toEqual({ error: 'Session not found' });
  });
});

describe('Socket.IO Integration Tests', () => {
  test('Client should connect to server', (done) => {
    const client = createSocketClient(serverPort);

    client.on('connect', () => {
      expect(client.connected).toBe(true);
      disconnectSocket(client).then(done);
    });
  });

  test('Client should join a session and receive session data', async () => {
    // Create session via REST API
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Connect client and join session
    const client = createSocketClient(serverPort);
    await waitForSocketEvent(client, 'connect');

    client.emit('join-session', sessionId);
    const sessionData = await waitForSocketEvent(client, 'session-joined');

    expect(sessionData).toEqual({
      code: '// Write your code here\n',
      language: 'javascript',
      participantCount: 1
    });

    await disconnectSocket(client);
  });

  test('Client should receive error when joining non-existent session', async () => {
    const client = createSocketClient(serverPort);
    await waitForSocketEvent(client, 'connect');

    client.emit('join-session', 'nonexistent');
    const error = await waitForSocketEvent(client, 'session-error');

    expect(error).toBe('Session not found');

    await disconnectSocket(client);
  });

  test('Multiple clients should receive real-time code updates', async () => {
    // Create session
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Connect two clients
    const client1 = createSocketClient(serverPort);
    const client2 = createSocketClient(serverPort);

    await waitForSocketEvent(client1, 'connect');
    await waitForSocketEvent(client2, 'connect');

    // Both join the same session
    client1.emit('join-session', sessionId);
    client2.emit('join-session', sessionId);

    await waitForSocketEvent(client1, 'session-joined');
    await waitForSocketEvent(client2, 'session-joined');

    // Client 1 changes code
    const newCode = 'console.log("Hello World");';
    
    const codeUpdatePromise = waitForSocketEvent(client2, 'code-update');
    client1.emit('code-change', { sessionId, code: newCode });

    const receivedCode = await codeUpdatePromise;
    expect(receivedCode).toBe(newCode);

    // Verify the code was persisted
    const sessionResponse = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .expect(200);

    expect(sessionResponse.body.code).toBe(newCode);

    await disconnectSocket(client1);
    await disconnectSocket(client2);
  });

  test('Participant count should update when clients join/leave', async () => {
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Client 1 joins
    const client1 = createSocketClient(serverPort);
    await waitForSocketEvent(client1, 'connect');
    
    client1.emit('join-session', sessionId);
    const joinData1 = await waitForSocketEvent(client1, 'session-joined');
    expect(joinData1.participantCount).toBe(1);

    // Client 2 joins
    const client2 = createSocketClient(serverPort);
    await waitForSocketEvent(client2, 'connect');
    
    const countUpdatePromise = waitForSocketEvent(client1, 'participant-count');
    client2.emit('join-session', sessionId);
    
    const joinData2 = await waitForSocketEvent(client2, 'session-joined');
    expect(joinData2.participantCount).toBe(2);

    const updatedCount = await countUpdatePromise;
    expect(updatedCount).toBe(2);

    // Client 1 disconnects
    const countDecreasePromise = waitForSocketEvent(client2, 'participant-count');
    await disconnectSocket(client1);
    
    const decreasedCount = await countDecreasePromise;
    expect(decreasedCount).toBe(1);

    await disconnectSocket(client2);
  });

  test('Language change should broadcast to all participants', async () => {
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    const client1 = createSocketClient(serverPort);
    const client2 = createSocketClient(serverPort);

    await waitForSocketEvent(client1, 'connect');
    await waitForSocketEvent(client2, 'connect');

    client1.emit('join-session', sessionId);
    client2.emit('join-session', sessionId);

    await waitForSocketEvent(client1, 'session-joined');
    await waitForSocketEvent(client2, 'session-joined');

    // Client 1 changes language
    const languageUpdatePromise1 = waitForSocketEvent(client1, 'language-update');
    const languageUpdatePromise2 = waitForSocketEvent(client2, 'language-update');
    
    client1.emit('language-change', { sessionId, language: 'python' });

    const [lang1, lang2] = await Promise.all([
      languageUpdatePromise1,
      languageUpdatePromise2
    ]);

    expect(lang1).toBe('python');
    expect(lang2).toBe('python');

    await disconnectSocket(client1);
    await disconnectSocket(client2);
  });

  test('Code changes from one client should not be sent back to sender', async () => {
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    const client1 = createSocketClient(serverPort);
    const client2 = createSocketClient(serverPort);

    await waitForSocketEvent(client1, 'connect');
    await waitForSocketEvent(client2, 'connect');

    client1.emit('join-session', sessionId);
    client2.emit('join-session', sessionId);

    await waitForSocketEvent(client1, 'session-joined');
    await waitForSocketEvent(client2, 'session-joined');

    // Track if client1 receives its own update (it shouldn't)
    let client1ReceivedOwnUpdate = false;
    client1.on('code-update', () => {
      client1ReceivedOwnUpdate = true;
    });

    // Client 1 changes code
    const codeUpdatePromise = waitForSocketEvent(client2, 'code-update');
    client1.emit('code-change', { sessionId, code: 'test code' });

    const receivedCode = await codeUpdatePromise;
    expect(receivedCode).toBe('test code');

    // Wait a bit to ensure client1 doesn't receive the update
    await sleep(200);
    expect(client1ReceivedOwnUpdate).toBe(false);

    await disconnectSocket(client1);
    await disconnectSocket(client2);
  });

  test('Cursor position should broadcast to other participants', async () => {
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    const client1 = createSocketClient(serverPort);
    const client2 = createSocketClient(serverPort);

    await waitForSocketEvent(client1, 'connect');
    await waitForSocketEvent(client2, 'connect');

    client1.emit('join-session', sessionId);
    client2.emit('join-session', sessionId);

    await waitForSocketEvent(client1, 'session-joined');
    await waitForSocketEvent(client2, 'session-joined');

    // Client 1 moves cursor
    const cursorPosition = { line: 5, column: 10 };
    const cursorUpdatePromise = waitForSocketEvent(client2, 'cursor-update');
    
    client1.emit('cursor-change', { sessionId, position: cursorPosition });

    const receivedCursor = await cursorUpdatePromise;
    expect(receivedCursor.position).toEqual(cursorPosition);
    expect(receivedCursor.socketId).toBe(client1.id);

    await disconnectSocket(client1);
    await disconnectSocket(client2);
  });

  test('Multiple sequential code changes should be handled correctly', async () => {
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    const client1 = createSocketClient(serverPort);
    const client2 = createSocketClient(serverPort);

    await waitForSocketEvent(client1, 'connect');
    await waitForSocketEvent(client2, 'connect');

    client1.emit('join-session', sessionId);
    client2.emit('join-session', sessionId);

    await waitForSocketEvent(client1, 'session-joined');
    await waitForSocketEvent(client2, 'session-joined');

    // Send multiple code changes
    const codeChanges = [
      'const x = 1;',
      'const x = 1;\nconst y = 2;',
      'const x = 1;\nconst y = 2;\nconsole.log(x + y);'
    ];

    for (const code of codeChanges) {
      const updatePromise = waitForSocketEvent(client2, 'code-update');
      client1.emit('code-change', { sessionId, code });
      const received = await updatePromise;
      expect(received).toBe(code);
    }

    // Verify final state
    const sessionResponse = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .expect(200);

    expect(sessionResponse.body.code).toBe(codeChanges[codeChanges.length - 1]);

    await disconnectSocket(client1);
    await disconnectSocket(client2);
  });

  test('Session should handle rapid connect/disconnect cycles', async () => {
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Connect and disconnect multiple clients rapidly
    for (let i = 0; i < 5; i++) {
      const client = createSocketClient(serverPort);
      await waitForSocketEvent(client, 'connect');
      
      client.emit('join-session', sessionId);
      await waitForSocketEvent(client, 'session-joined');
      
      await disconnectSocket(client);
    }

    // Final check - session should exist and have 0 participants
    const sessionResponse = await request(app)
      .get(`/api/sessions/${sessionId}`)
      .expect(200);

    expect(sessionResponse.body.participantCount).toBe(0);
  });

  test('Three or more clients should all receive updates', async () => {
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    const clients = [];
    for (let i = 0; i < 3; i++) {
      const client = createSocketClient(serverPort);
      await waitForSocketEvent(client, 'connect');
      client.emit('join-session', sessionId);
      await waitForSocketEvent(client, 'session-joined');
      clients.push(client);
    }

    // Client 0 sends code change
    const newCode = 'function test() { return true; }';
    const updatePromises = [
      waitForSocketEvent(clients[1], 'code-update'),
      waitForSocketEvent(clients[2], 'code-update')
    ];

    clients[0].emit('code-change', { sessionId, code: newCode });

    const [code1, code2] = await Promise.all(updatePromises);
    expect(code1).toBe(newCode);
    expect(code2).toBe(newCode);

    // Clean up
    for (const client of clients) {
      await disconnectSocket(client);
    }
  });
});

describe('Session Management Integration Tests', () => {
  test('Session state should persist across different clients', async () => {
    const createResponse = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId = createResponse.body.sessionId;

    // Client 1 joins and sets code
    const client1 = createSocketClient(serverPort);
    await waitForSocketEvent(client1, 'connect');
    client1.emit('join-session', sessionId);
    await waitForSocketEvent(client1, 'session-joined');

    const testCode = 'const greeting = "Hello";';
    client1.emit('code-change', { sessionId, code: testCode });
    await sleep(100); // Allow time for state update

    await disconnectSocket(client1);

    // Client 2 joins and should receive the updated code
    const client2 = createSocketClient(serverPort);
    await waitForSocketEvent(client2, 'connect');
    client2.emit('join-session', sessionId);
    
    const sessionData = await waitForSocketEvent(client2, 'session-joined');
    expect(sessionData.code).toBe(testCode);

    await disconnectSocket(client2);
  });

  test('Different sessions should be isolated', async () => {
    // Create two sessions
    const session1Response = await request(app)
      .post('/api/sessions')
      .expect(200);
    const session2Response = await request(app)
      .post('/api/sessions')
      .expect(200);

    const sessionId1 = session1Response.body.sessionId;
    const sessionId2 = session2Response.body.sessionId;

    // Client 1 joins session 1
    const client1 = createSocketClient(serverPort);
    await waitForSocketEvent(client1, 'connect');
    client1.emit('join-session', sessionId1);
    await waitForSocketEvent(client1, 'session-joined');

    // Client 2 joins session 2
    const client2 = createSocketClient(serverPort);
    await waitForSocketEvent(client2, 'connect');
    client2.emit('join-session', sessionId2);
    await waitForSocketEvent(client2, 'session-joined');

    // Track if client2 receives updates (it shouldn't)
    let client2ReceivedUpdate = false;
    client2.on('code-update', () => {
      client2ReceivedUpdate = true;
    });

    // Client 1 changes code in session 1
    client1.emit('code-change', { sessionId: sessionId1, code: 'session1 code' });
    await sleep(200);

    expect(client2ReceivedUpdate).toBe(false);

    // Verify sessions have different code
    const session1Data = await request(app)
      .get(`/api/sessions/${sessionId1}`)
      .expect(200);
    const session2Data = await request(app)
      .get(`/api/sessions/${sessionId2}`)
      .expect(200);

    expect(session1Data.body.code).toBe('session1 code');
    expect(session2Data.body.code).toBe('// Write your code here\n');

    await disconnectSocket(client1);
    await disconnectSocket(client2);
  });
});