# Module-02: Online Coding Interview Platform

A real-time collaborative coding platform designed for conducting technical job interviews. The platform enables interviewers and candidates to write, edit, and execute code together in real-time.

## Project Structure

```
module-02/
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
            └── codeExecutor.js    # Code execution utilities (unused - logic in InterviewRoom)
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
- In-browser execution for JavaScript/TypeScript
- Captures console.log, console.error, console.warn, console.info
- Error handling and runtime error display
- Simulated execution for other languages (Python, Java, C++)

### Session Management
- Unique session IDs generated with nanoid
- Session persistence while participants are connected
- Automatic cleanup of abandoned sessions
- Simple URL-based session sharing

## Setup and Running Instructions

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or yarn package manager

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Run the Application

You need to run both backend and frontend in separate terminals.

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```
The backend server will start on **http://localhost:3000**

> **Development Mode**: For auto-reload during development, use:
> ```bash
> npm run dev
> ```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
The frontend development server will start on **http://localhost:5173**

### 3. Access the Application

Open your browser and navigate to: **http://localhost:5173**

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

✅ **Create and Share Links**: Generate unique session links to share with candidates
✅ **Real-time Collaboration**: Multiple users can edit code simultaneously with instant updates
✅ **Syntax Highlighting**: Monaco Editor (VS Code) with support for multiple languages
✅ **Code Execution**: Safe in-browser JavaScript execution with console output capture
✅ **Language Support**: JavaScript, TypeScript, Python, Java, C++
✅ **Participant Count**: Shows number of active users in the session
✅ **Professional UI**: Modern, responsive design with dark theme
✅ **Session Persistence**: Sessions persist as long as there are active participants

## Architecture Highlights

- **WebSocket Communication**: Socket.IO for real-time bidirectional updates
- **Monaco Editor**: Same editor that powers VS Code
- **Session Management**: In-memory session storage with automatic cleanup
- **Safe Execution**: Sandboxed JavaScript execution in the browser
- **Responsive Design**: Works on desktop and mobile devices

## Usage Flow

1. **Interviewer**: Open the application at http://localhost:5173 and click "Create New Session"
2. **Share**: Copy the generated session link
3. **Candidate**: Open the shared link to join the session
4. **Collaborate**: Both parties can now edit code in real-time
5. **Execute**: Click "Run Code" to execute JavaScript/TypeScript
6. **Review**: See output in the output panel

This platform is production-ready for JavaScript interviews and can be extended with additional features like video chat, whiteboarding, or backend code execution services for other languages!

## Running the Tests

### Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

For frontend, ensure all testing dependencies are installed:
```bash
npm install --save-dev @babel/preset-env @babel/preset-react babel-jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom identity-obj-proxy
```

### Run Backend Tests

```bash
cd backend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Run Frontend Tests

```bash
cd frontend
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

### Run All Tests

Create a root `package.json` in the `module-02` directory:

```json
{
  "name": "coding-interview-platform",
  "private": true,
  "scripts": {
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "test:all": "npm run test:backend && npm run test:frontend"
  }
}
```

Then run:
```bash
npm test
```

### Test Coverage

The integration tests cover:

✅ **REST API Endpoints**
- Creating sessions
- Retrieving session data
- Error handling for non-existent sessions

✅ **WebSocket Communication**
- Client connection and disconnection
- Joining sessions
- Real-time code synchronization
- Language changes
- Cursor position updates
- Participant count updates

✅ **Multi-Client Scenarios**
- Multiple clients in same session
- Session isolation between different sessions
- Broadcast vs. targeted messages
- Sequential updates

✅ **Frontend Components**
- Session creation flow
- Joining interview rooms
- Code editing and synchronization
- Running code and displaying output
- Error handling and edge cases

✅ **End-to-End Flows**
- Complete user journey from creation to execution

These tests ensure that the client-server integration works correctly and all real-time features function as expected!

## Limitations & Future Enhancements

### Current Limitations
- Code execution limited to JavaScript/TypeScript in browser
- In-memory session storage (lost on server restart)
- No authentication or authorization
- No session history or code persistence
- No video/audio communication

### Potential Enhancements
- Backend code execution service for all languages (Docker containers, sandboxed environments)
- Database persistence (MongoDB, PostgreSQL)
- User authentication and role management (interviewer vs. candidate)
- Session recording and playback
- Video/audio integration
- Code review and annotation tools
- Multiple file support
- Test case management
- Interview feedback system

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