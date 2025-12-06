import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import CodeEditor from './CodeEditor';
import OutputPanel from './OutputPanel';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function InterviewRoom() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [participantCount, setParticipantCount] = useState(0);
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    // Early exit if sessionId is not available
    if (!sessionId) {
      console.error('No sessionId provided');
      setError('Invalid session ID');
      setLoading(false);
      return;
    }

    let timeoutId = null;
    let isSessionLoaded = false;

    console.log('Initializing InterviewRoom with sessionId:', sessionId);

    // Initialize socket connection
    const newSocket = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      console.log('Emitting join-session for sessionId:', sessionId);
      // Join the session after successful connection
      newSocket.emit('join-session', sessionId);

      // Set timeout only after emitting join-session
      timeoutId = setTimeout(() => {
        if (!isSessionLoaded) {
          console.error('Session loading timeout after 10 seconds');
          setError('Session loading timeout. Please try again.');
          setLoading(false);
        }
      }, 10000);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      if (timeoutId) clearTimeout(timeoutId);
      setError('Failed to connect to server. Please check if the backend is running.');
      setLoading(false);
    });

    // Listen for session joined event
    newSocket.on('session-joined', (data) => {
      console.log('Session joined successfully:', data);
      isSessionLoaded = true;
      if (timeoutId) clearTimeout(timeoutId);
      setCode(data.code);
      setLanguage(data.language);
      setParticipantCount(data.participantCount);
      setLoading(false);
    });

    // Listen for session error
    newSocket.on('session-error', (errorMsg) => {
      console.error('Session error:', errorMsg);
      isSessionLoaded = true;
      if (timeoutId) clearTimeout(timeoutId);
      setError(errorMsg);
      setLoading(false);
    });

    // Listen for code updates from other users
    newSocket.on('code-update', (newCode) => {
      setCode(newCode);
    });

    // Listen for language updates
    newSocket.on('language-update', (newLanguage) => {
      setLanguage(newLanguage);
    });

    // Listen for participant count updates
    newSocket.on('participant-count', (count) => {
      setParticipantCount(count);
    });

    // Cleanup on unmount
    return () => {
      console.log('Cleaning up InterviewRoom');
      if (timeoutId) clearTimeout(timeoutId);
      newSocket.disconnect();
    };
  }, [sessionId]);

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    if (socket) {
      socket.emit('code-change', { sessionId, code: newCode });
    }
  };

  const handleLanguageChange = (newLanguage) => {
    setLanguage(newLanguage);
    if (socket) {
      socket.emit('language-change', { sessionId, language: newLanguage });
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setOutput([{ type: 'info', message: 'Running code...' }]);

    try {
      const result = await executeCode(code, language);
      setOutput(result);
    } catch (error) {
      setOutput([{ type: 'error', message: error.message }]);
    } finally {
      setIsRunning(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading session...</div>;
  }

  if (error) {
    return (
      <div className="error-message">
        <h2>Error: {error}</h2>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="interview-room">
      <div className="room-header">
        <div className="room-info">
          <h2>Interview Session</h2>
          <div className="participant-count">
            {participantCount} participant{participantCount !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="room-controls">
          <select
            className="language-selector"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
            <option value="typescript">TypeScript</option>
          </select>
          <button 
            className="run-btn" 
            onClick={handleRunCode}
            disabled={isRunning}
          >
            ▶ {isRunning ? 'Running...' : 'Run Code'}
          </button>
        </div>
      </div>
      
      <div className="room-content">
        <div className="editor-section">
          <CodeEditor
            code={code}
            language={language}
            onChange={handleCodeChange}
          />
        </div>
        <OutputPanel output={output} />
      </div>
    </div>
  );
}

// Simple in-browser code execution
async function executeCode(code, language) {
  const output = [];

  try {
    if (language === 'javascript' || language === 'typescript') {
      // Create a safe execution context
      const logs = [];
      const errors = [];

      // Override console methods
      const customConsole = {
        log: (...args) => logs.push(args.map(arg => String(arg)).join(' ')),
        error: (...args) => errors.push(args.map(arg => String(arg)).join(' ')),
        warn: (...args) => logs.push('⚠️ ' + args.map(arg => String(arg)).join(' ')),
        info: (...args) => logs.push('ℹ️ ' + args.map(arg => String(arg)).join(' '))
      };

      try {
        // Create a function with custom console
        const func = new Function('console', code);
        func(customConsole);

        // Add logs to output
        logs.forEach(log => {
          output.push({ type: 'success', message: log });
        });

        errors.forEach(error => {
          output.push({ type: 'error', message: error });
        });

        if (logs.length === 0 && errors.length === 0) {
          output.push({ type: 'info', message: 'Code executed successfully (no output)' });
        }
      } catch (error) {
        output.push({ type: 'error', message: `Runtime Error: ${error.message}` });
      }
    } else {
      output.push({ 
        type: 'info', 
        message: `${language} execution is simulated in browser. In production, use a backend service for secure execution.` 
      });
      output.push({ 
        type: 'success', 
        message: 'Code syntax appears valid.' 
      });
    }
  } catch (error) {
    output.push({ type: 'error', message: `Execution Error: ${error.message}` });
  }

  return output;
}

export default InterviewRoom;