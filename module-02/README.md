# Module-02: Online Coding Interview Platform

A real-time collaborative coding platform designed for conducting technical job interviews. The platform enables interviewers and candidates to write, edit, and execute code together in real-time.

## Project Structure

```
module-02/
├── package.json                # Root package with concurrently setup
├── backend/                    # Express.js backend server
│   ├── package.json           # Backend dependencies and scripts
│   ├── server.js              # Main server and Socket.IO configuration
│   └── sessions.js            # Session management logic
└── frontend/                  # Vite + React frontend
    ├── package.json           # Frontend dependencies and scripts
    ├── index.html             # HTML entry point
    ├── vite.config.js         # Vite configuration
    └── src/
        ├── main.jsx           # React application entry point
        ├── App.jsx            # Main app component with routing
        ├── App.css            # Global styles
        ├── components/
        │   ├── Home.jsx           # Landing page - create/join sessions
        │   ├── InterviewRoom.jsx  # Main interview room container
        │   ├── CodeEditor.jsx     # Monaco code editor component
        │   └── OutputPanel.jsx    # Code execution output display
        └── utils/
            └── codeExecutor.js    # Code execution via WASM (JavaScript, TypeScript, Python)
```

## Technology Stack

### Backend
- **Express.js** - Web application framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-Origin Resource Sharing middleware
- **nanoid** - Unique ID generator for sessions

### Frontend
- **Vite** - Fast build tool and development server
- **React** - UI library
- **React Router DOM** - Client-side routing
- **Socket.IO Client** - Real-time communication client
- **Monaco Editor** - VS Code's code editor component
- **Pyodide** - Python WASM runtime for in-browser Python execution

## Architecture & Components

### Backend Components

#### [`server.js`](backend/server.js)
Main server file that handles:
- **HTTP Server**: Express.js server with CORS enabled
- **REST API Endpoints**:
  - `POST /api/sessions` - Create new interview session
  - `GET /api/sessions/:sessionId` - Get session information
- **Socket.IO Events**:
  - `join-session` - User joins an interview session
  - `code-change` - Broadcast code changes to other participants
  - `language-change` - Broadcast programming language changes
  - `cursor-change` - Share cursor position (for future collaboration features)
  - `disconnect` - Handle user disconnection and cleanup

#### [`sessions.js`](backend/sessions.js)
Session management module that provides:
- **SessionManager Class**: Singleton pattern for managing all sessions
- **Session Creation**: Generate unique session IDs with default code template
- **Session Storage**: In-memory storage using Map data structure
- **Participant Tracking**: Track connected users via Socket.IO IDs
- **Auto Cleanup**: Remove empty sessions after 1 hour of inactivity
- **State Management**: Update code, language, and participant count

### Frontend Components

#### [`main.jsx`](frontend/src/main.jsx)
React application entry point that renders the App component into the DOM.

#### [`App.jsx`](frontend/src/App.jsx)
Main application component with React Router configuration:
- Route `/` - Home page for creating/joining sessions
- Route `/session/:sessionId` - Interview room for collaborative coding

#### [`Home.jsx`](frontend/src/components/Home.jsx)
Landing page component featuring:
- **Create Session**: Button to generate new interview session
- **Session Link Display**: Shows shareable URL for the session
- **Copy to Clipboard**: Quick copy functionality for sharing
- **Join Session**: Navigate to the created session

#### [`InterviewRoom.jsx`](frontend/src/components/InterviewRoom.jsx)
Main interview room container that manages:
- **Socket.IO Connection**: Real-time communication with backend
- **Session State**: Code, language, participant count
- **Event Handlers**: 
  - Code synchronization across participants
  - Language selection synchronization
  - Participant count updates
- **Code Execution**: In-browser JavaScript/TypeScript execution
- **UI Layout**: Header with controls, code editor, and output panel

#### [`CodeEditor.jsx`](frontend/src/components/CodeEditor.jsx)
Monaco Editor wrapper component providing:
- **VS Code Editor**: Full-featured code editor in the browser
- **Syntax Highlighting**: Support for JavaScript, TypeScript, Python, Java, C++
- **Editor Configuration**: Font size, minimap, word wrap, auto-layout
- **Theme**: Dark theme by default
- **Real-time Updates**: Propagates changes to parent component

#### [`OutputPanel.jsx`](frontend/src/components/OutputPanel.jsx)
Code execution output display featuring:
- **Output Types**: Success, error, info messages with distinct styling
- **Empty State**: Helpful message when no output available
- **Multiple Outputs**: Displays all console logs and errors
- **Styled Messages**: Color-coded by message type

#### [`codeExecutor.js`](frontend/src/utils/codeExecutor.js)
Code execution utility providing secure WASM-based execution:
- **JavaScript**: Direct execution with custom console capture
- **TypeScript**: Executed as JavaScript
- **Python**: WASM execution via Pyodide (lazy initialization on first use)
- **Output Capture**: Captures console.log, console.error, console.warn, console.info
- **Security**: All execution in-browser, no server code execution

## Features

### Real-Time Collaboration
- Multiple participants can join the same session
- Code changes are synchronized instantly across all participants
- Participant count displayed in real-time
- Language selection synchronized across all users

### Code Editor
- Professional Monaco Editor (same as VS Code)
- Syntax highlighting for multiple languages
- Auto-completion and IntelliSense
- Minimap for code navigation
- Word wrap and automatic layout

### Code Execution
- In-browser execution for **JavaScript/TypeScript** (direct execution)
- In-browser execution for **Python** via Pyodide WebAssembly
- Captures console.log, console.error, console.warn, console.info
- Error handling and runtime error display
- Zero server-side code execution (secure by design)

### Session Management
- Unique session IDs generated with nanoid
- Session persistence while participants are connected
- Automatic cleanup of abandoned sessions
- Simple URL-based session sharing

## Setup and Running Instructions

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or yarn

### Quick Start (Concurrent Mode)

From the `module-02` root directory:

```bash
# Install all dependencies
npm run install:all

# Run both backend and frontend simultaneously
npm run dev
```

This starts:
- **Backend**: http://localhost:3000
- **Frontend**: http://localhost:5173

Press **Ctrl+C** to stop both services.

### Alternative: Run Separately

**Backend:**
```bash
cd backend
npm install
npm run dev        # Auto-reload mode
# or: npm start   # Production mode
```

**Frontend (in another terminal):**
```bash
cd frontend
npm install
npm run dev
```

### Available Commands

**Root Level** (`module-02/`):
```bash
npm run dev              # Start backend + frontend concurrently
npm run dev:backend      # Backend only
npm run dev:frontend     # Frontend only
npm run install:all      # Install all dependencies
npm test                 # Run all tests
```

**Backend:**
```bash
npm run dev              # Watch mode
npm start                # Production
npm test                 # Run tests
npm run test:watch       # Watch tests
npm run test:coverage    # Coverage report
```

**Frontend:**
```bash
npm run dev              # Development server
npm run build            # Build for production
npm run preview          # Preview production build
npm test                 # Run tests
npm run test:watch       # Watch tests
npm run test:coverage    # Coverage report
```

### Environment Variables (Optional)

**Frontend** (create `.env` file in `frontend/` directory):
```
VITE_API_URL=http://localhost:3000
```

**Backend** (create `.env` file in `backend/` directory or set environment variables):
```
PORT=3000
FRONTEND_URL=http://localhost:5173
```

> **Note**: The application will work with default values even without these environment variables.

## Features Implemented

✅ **Create and Share Links**: Generate unique session IDs for easy sharing
✅ **Real-time Collaboration**: Multiple users edit code simultaneously
✅ **Syntax Highlighting**: Monaco Editor (VS Code) with multiple languages
✅ **JavaScript Execution**: Safe in-browser execution with console capture
✅ **Python Execution**: WASM-based Python via Pyodide (secure, no server code execution)
✅ **TypeScript Support**: Executed as JavaScript in browser
✅ **Language Selector**: Switch between JavaScript, TypeScript, Python, Java, C++
✅ **Participant Count**: Real-time user count in each session
✅ **Professional UI**: Dark theme, responsive design
✅ **Session Persistence**: Sessions last until all participants disconnect
✅ **Concurrent Execution**: Run backend + frontend simultaneously with `npm run dev`

## Architecture Highlights

- **WebSocket Communication**: Socket.IO for real-time bidirectional updates
- **Monaco Editor**: Professional code editor (VS Code)
- **Session Management**: In-memory storage with auto-cleanup after 1 hour
- **Safe Execution**: 
  - JavaScript/TypeScript: Browser sandbox
  - Python: WASM via Pyodide (no server execution)
- **Responsive Design**: Works on desktop and mobile
- **Concurrent Development**: Both services start together with one command

## Usage Flow

1. **Start**: Run `npm run dev` from `module-02/`
2. **Interviewer**: Open http://localhost:5173 → Create Session
3. **Share**: Copy the session link
4. **Candidate**: Open the link to join
5. **Code**: Both edit in real-time
6. **Execute**: Click Run Code to execute JavaScript/Python
7. **Output**: Results shown in output panel

## Running the Tests

### Quick Start

From `module-02/` root:
```bash
npm test
```

### Individual Test Commands

**Backend:**
```bash
cd backend
npm test                 # Run tests once
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage
```

**Frontend:**
```bash
cd frontend
npm test
npm run test:watch
npm run test:coverage
```

### Test Coverage

- ✅ REST API endpoints (session creation, retrieval)
- ✅ WebSocket events (join, code sync, language change)
- ✅ Multi-client scenarios
- ✅ Real-time synchronization
- ✅ Session management and cleanup

## Limitations & Future Enhancements

### Current Limitations
- Python first load has initial WASM overhead (subsequent runs are fast)
- Java and C++ not yet supported (require additional sandboxes)
- In-memory session storage (lost on restart)
- No authentication or user persistence
- No session recording or code history

### Potential Enhancements
- Persist sessions to database
- User authentication and roles
- Code history and session playback
- Video/audio chat integration
- More language support (Java, C++, Go, Rust)
- Session recording and analytics
- Code review and annotation tools
- Collaborative features (cursors, selections)

## Security Considerations

⚠️ **Note**: This is a development/educational project. For production use, consider:
- Implement authentication and authorization
- Use secure session management
- Sandbox code execution (never run untrusted code directly)
- Rate limiting on API endpoints
- Input validation and sanitization
- HTTPS/WSS for secure connections
- Environment-based configuration management

## License

MIT