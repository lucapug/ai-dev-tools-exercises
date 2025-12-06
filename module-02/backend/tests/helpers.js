import { io as ioclient } from 'socket.io-client';

export function createSocketClient(port = 3001) {
  return ioclient(`http://localhost:${port}`, {
    transports: ['websocket'],
    forceNew: true,
    reconnection: false
  });
}

export function waitForSocketEvent(socket, event, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);

    socket.once(event, (data) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

export function disconnectSocket(socket) {
  return new Promise((resolve) => {
    if (socket.connected) {
      socket.disconnect();
    }
    resolve();
  });
}

export async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}