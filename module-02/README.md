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

## Containerizing

This application can be run in a Docker container with both backend and frontend bundled together.

### Build the Docker Image

From the `module-02` directory:

```bash
docker build -t coding-interview-platform .
```

### Run the Container

```bash
docker run -p 3000:3000 coding-interview-platform
```

The application will be available at http://localhost:3000

### Docker Compose (Optional)

For easier management, you can create a `docker-compose.yml` file:

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
    restart: unless-stopped
```

Then run:

```bash
docker-compose up -d
```

### Container Architecture

The Docker container uses a multi-stage build process:

1. **Builder Stage**:
   - Installs all dependencies (backend + frontend)
   - Builds the React frontend into static files
   
2. **Production Stage**:
   - Copies only production dependencies for the backend
   - Copies the built frontend files
   - Serves both API and frontend from a single Express server on port 3000

### Environment Variables

You can pass environment variables when running the container:

```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -e PORT=3000 \
  coding-interview-platform
```

### Notes

- The frontend is built as static files and served by the Express backend in production mode
- WebSocket connections work seamlessly through the same port (3000)
- No separate frontend server needed in production
- The container uses Node.js 18 Alpine for a smaller image size

## Deploying to Render

This application can be deployed to [Render](https://render.com) as a **Web Service**.

### Prerequisites

1. A Render account (free tier available)
2. Your code in a Git repository (GitHub, GitLab, or Bitbucket)

### Deployment Options

#### Option 1: Using render.yaml (Recommended)

The repository includes a [`render.yaml`](render.yaml) blueprint for automated deployment.

**Important**: The `render.yaml` file is configured to work with this project in the `module-02` subdirectory using the `rootDir: module-02` directive.

1. Push your code to a Git repository (the entire repository, including the `module-02` folder)
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **New** → **Blueprint**
4. Connect your repository
5. Render will automatically detect the `render.yaml` and deploy your application from the `module-02` subdirectory

#### Option 2: Manual Web Service Creation

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New** → **Web Service**
3. Connect your repository
4. Configure the service:
   - **Name**: `coding-interview-platform`
   - **Runtime**: `Node`
   - **Root Directory**: `module-02` ⚠️ **Important: Set this to point to the subdirectory**
   - **Build Command**: `npm run install:all && cd frontend && npm run build`
   - **Start Command**: `node backend/server.js`
   - **Environment Variables**:
     - `NODE_ENV` = `production`

5. Click **Create Web Service**

### Post-Deployment

- Your application will be available at: `https://your-app-name.onrender.com`
- The free tier may spin down after inactivity (takes ~30 seconds to spin up)
- WebSocket connections work automatically (no additional configuration needed)
- Update the CORS origins in [`backend/server.js`](backend/server.js:15) if needed to include your Render URL

### Environment Variables on Render

Render automatically sets the `PORT` environment variable. You can add additional variables in the Render dashboard:

- `NODE_ENV=production` (recommended)
- `FRONTEND_URL` (optional, for CORS configuration)

### Cost

- **Free Tier**: Available for testing and small projects
  - 750 hours/month of free usage
  - Services spin down after 15 minutes of inactivity
  
- **Paid Plans**: Starting at $7/month for always-on services with more resources

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