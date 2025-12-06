import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import Home from '../src/components/Home';
import InterviewRoom from '../src/components/InterviewRoom';
import { mockFetch, mockSocket } from './helpers';

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => ({ sessionId: 'test-session-123' }),
}));

// Mock socket.io-client
let mockSocketInstance;
jest.mock('socket.io-client', () => ({
  io: jest.fn(() => {
    mockSocketInstance = mockSocket();
    return mockSocketInstance;
  }),
}));

describe('Home Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should create a session and display the link', async () => {
    const sessionId = 'abc123xyz';
    mockFetch({ sessionId, url: `http://localhost:3000/session/${sessionId}` });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const createButton = screen.getByText(/Create New Session/i);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/sessions',
        expect.objectContaining({
          method: 'POST',
        })
      );
    });

    await waitFor(() => {
      const linkInput = screen.getByDisplayValue(new RegExp(sessionId));
      expect(linkInput).toBeInTheDocument();
    });
  });

  test('should copy link to clipboard', async () => {
    const sessionId = 'abc123xyz';
    const sessionUrl = `http://localhost:5173/session/${sessionId}`;
    mockFetch({ sessionId, url: sessionUrl });

    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(() => Promise.resolve()),
      },
    });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const createButton = screen.getByText(/Create New Session/i);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Share this link/i)).toBeInTheDocument();
    });

    const copyButton = screen.getByText(/Copy/i);
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining(sessionId)
      );
      expect(screen.getByText(/Copied!/i)).toBeInTheDocument();
    });
  });

  test('should navigate to session when join button is clicked', async () => {
    const sessionId = 'abc123xyz';
    mockFetch({ sessionId, url: `http://localhost:3000/session/${sessionId}` });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const createButton = screen.getByText(/Create New Session/i);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByText(/Join Session/i)).toBeInTheDocument();
    });

    const joinButton = screen.getByText(/Join Session/i);
    fireEvent.click(joinButton);

    expect(mockNavigate).toHaveBeenCalledWith(`/session/${sessionId}`);
  });

  test('should handle session creation error gracefully', async () => {
    mockFetch({ error: 'Server error' }, 500);
    
    // Mock window.alert
    window.alert = jest.fn();

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const createButton = screen.getByText(/Create New Session/i);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create session')
      );
    });
  });
});

describe('InterviewRoom Component Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSocketInstance = mockSocket();
  });

  test('should connect to socket and join session', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'join-session',
        'test-session-123'
      );
    });
  });

  test('should display session data after joining', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    // Simulate server response
    mockSocketInstance._trigger('session-joined', {
      code: '// Test code',
      language: 'javascript',
      participantCount: 1,
    });

    await waitFor(() => {
      expect(screen.queryByText(/Loading session/i)).not.toBeInTheDocument();
      expect(screen.getByText(/1 participant/i)).toBeInTheDocument();
    });
  });

  test('should handle session not found error', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-error', 'Session not found');

    await waitFor(() => {
      expect(screen.getByText(/Error: Session not found/i)).toBeInTheDocument();
      expect(screen.getByText(/Go Home/i)).toBeInTheDocument();
    });
  });

  test('should update participant count when users join/leave', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-joined', {
      code: '// Test',
      language: 'javascript',
      participantCount: 1,
    });

    await waitFor(() => {
      expect(screen.getByText(/1 participant/i)).toBeInTheDocument();
    });

    // Another user joins
    mockSocketInstance._trigger('participant-count', 2);

    await waitFor(() => {
      expect(screen.getByText(/2 participants/i)).toBeInTheDocument();
    });
  });

  test('should emit code changes to server', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-joined', {
      code: '// Initial code',
      language: 'javascript',
      participantCount: 1,
    });

    await waitFor(() => {
      expect(screen.getByTestId('monaco-editor')).toBeInTheDocument();
    });

    const editor = screen.getByTestId('monaco-editor');
    const newCode = 'console.log("test");';
    
    fireEvent.change(editor, { target: { value: newCode } });

    await waitFor(() => {
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'code-change',
        expect.objectContaining({
          sessionId: 'test-session-123',
          code: newCode,
        })
      );
    });
  });

  test('should receive and display code updates from other users', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-joined', {
      code: '// Initial',
      language: 'javascript',
      participantCount: 2,
    });

    const newCode = 'const x = 42;';
    mockSocketInstance._trigger('code-update', newCode);

    await waitFor(() => {
      const editor = screen.getByTestId('monaco-editor');
      expect(editor.value).toBe(newCode);
    });
  });

  test('should change language and emit to server', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-joined', {
      code: '// Code',
      language: 'javascript',
      participantCount: 1,
    });

    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    const languageSelector = screen.getByRole('combobox');
    fireEvent.change(languageSelector, { target: { value: 'python' } });

    await waitFor(() => {
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'language-change',
        expect.objectContaining({
          sessionId: 'test-session-123',
          language: 'python',
        })
      );
    });
  });

  test('should receive language updates from other users', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-joined', {
      code: '// Code',
      language: 'javascript',
      participantCount: 2,
    });

    mockSocketInstance._trigger('language-update', 'python');

    await waitFor(() => {
      const languageSelector = screen.getByRole('combobox');
      expect(languageSelector.value).toBe('python');
    });
  });

  test('should run code and display output', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-joined', {
      code: 'console.log("Hello World");',
      language: 'javascript',
      participantCount: 1,
    });

    await waitFor(() => {
      expect(screen.getByText(/▶ Run Code/i)).toBeInTheDocument();
    });

    const runButton = screen.getByText(/▶ Run Code/i);
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/Running code/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/Hello World/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('should display error output when code has errors', async () => {
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-joined', {
      code: 'console.log(undefinedVariable);',
      language: 'javascript',
      participantCount: 1,
    });

    await waitFor(() => {
      expect(screen.getByText(/▶ Run Code/i)).toBeInTheDocument();
    });

    const runButton = screen.getByText(/▶ Run Code/i);
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/Error/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  test('should disconnect socket when component unmounts', async () => {
    const { unmount } = render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    mockSocketInstance._trigger('session-joined', {
      code: '// Code',
      language: 'javascript',
      participantCount: 1,
    });

    await waitFor(() => {
      expect(screen.getByText(/1 participant/i)).toBeInTheDocument();
    });

    unmount();

    expect(mockSocketInstance.disconnect).toHaveBeenCalled();
  });
});

describe('End-to-End User Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('complete flow: create session, join, edit code, run code', async () => {
    const sessionId = 'e2e-test-session';
    mockFetch({ sessionId, url: `http://localhost:3000/session/${sessionId}` });

    // Step 1: Create session
    const { unmount } = render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const createButton = screen.getByText(/Create New Session/i);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(screen.getByDisplayValue(new RegExp(sessionId))).toBeInTheDocument();
    });

    const joinButton = screen.getByText(/Join Session/i);
    fireEvent.click(joinButton);

    unmount();

    // Step 2: Join interview room
    render(
      <BrowserRouter>
        <InterviewRoom />
      </BrowserRouter>
    );

    // Simulate successful join
    mockSocketInstance._trigger('session-joined', {
      code: '// Write your code here',
      language: 'javascript',
      participantCount: 1,
    });

    await waitFor(() => {
      expect(screen.getByText(/Interview Session/i)).toBeInTheDocument();
    });

    // Step 3: Edit code
    const editor = screen.getByTestId('monaco-editor');
    const testCode = 'console.log("Integration test");';
    fireEvent.change(editor, { target: { value: testCode } });

    await waitFor(() => {
      expect(mockSocketInstance.emit).toHaveBeenCalledWith(
        'code-change',
        expect.objectContaining({ code: testCode })
      );
    });

    // Step 4: Run code
    const runButton = screen.getByText(/▶ Run Code/i);
    fireEvent.click(runButton);

    await waitFor(() => {
      expect(screen.getByText(/Integration test/i)).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});