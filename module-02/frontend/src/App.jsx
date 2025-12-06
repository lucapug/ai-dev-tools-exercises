import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import InterviewRoom from './components/InterviewRoom';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/session/:sessionId" element={<InterviewRoom />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;