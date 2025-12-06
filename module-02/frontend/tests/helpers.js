export function waitFor(callback, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    const interval = setInterval(() => {
      try {
        const result = callback();
        if (result) {
          clearInterval(interval);
          resolve(result);
        }
      } catch (error) {
        // Continue waiting
      }
      
      if (Date.now() - startTime > timeout) {
        clearInterval(interval);
        reject(new Error('Timeout waiting for condition'));
      }
    }, 100);
  });
}

export function mockFetch(responseData, status = 200) {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(responseData),
    })
  );
}

export function mockSocket() {
  const listeners = {};
  
  const socket = {
    id: 'mock-socket-id',
    connected: true,
    emit: jest.fn(),
    on: jest.fn((event, callback) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    }),
    once: jest.fn((event, callback) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    }),
    off: jest.fn((event, callback) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
    }),
    disconnect: jest.fn(),
    // Helper to trigger events in tests
    _trigger: (event, data) => {
      if (listeners[event]) {
        listeners[event].forEach(callback => callback(data));
      }
    },
    _listeners: listeners
  };
  
  return socket;
}