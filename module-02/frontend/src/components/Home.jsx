import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function Home() {
  const [sessionLink, setSessionLink] = useState('');
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const createSession = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      const fullUrl = `${window.location.origin}/session/${data.sessionId}`;
      setSessionLink(fullUrl);
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(sessionLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const joinSession = () => {
    const sessionId = sessionLink.split('/').pop();
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="home-container">
      <div className="home-content">
        <h1>🚀 Code Interview</h1>
        <p>Real-time collaborative coding platform for technical interviews</p>
        
        <button className="create-btn" onClick={createSession}>
          Create New Session
        </button>

        {sessionLink && (
          <div className="link-container">
            <p>Share this link with your candidate:</p>
            <div className="link-display">
              <input
                type="text"
                className="link-input"
                value={sessionLink}
                readOnly
              />
              <button 
                className={`copy-btn ${copied ? 'copied' : ''}`}
                onClick={copyLink}
              >
                {copied ? '✓ Copied!' : 'Copy'}
              </button>
            </div>
            <button 
              className="join-btn"
              onClick={joinSession}
              style={{ marginTop: '10px', width: '100%' }}
            >
              Join Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Home;