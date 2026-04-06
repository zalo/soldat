// web/network.js — WebSocket networking via PartySocket + room URL management
import PartySocket from './lib/partysocket.js';

export function createNetworkBridge(memory) {
  let socket = null;
  const incomingQueue = []; // ArrayBuffer[]
  let connectionState = 0; // 0=none, 1=connecting, 2=connected, 3=closed

  function readString(ptr) {
    const view = new Uint8Array(memory.buffer);
    let end = ptr;
    while (view[end] !== 0) end++;
    return new TextDecoder().decode(view.subarray(ptr, end));
  }

  return {
    ws_connect: (hostPtr, roomPtr) => {
      const host = readString(hostPtr);
      const room = readString(roomPtr);
      connectionState = 1;

      // Use current page host if none specified (for PartyKit dev server)
      const effectiveHost = host || window.location.host;
      console.log(`[ws] Connecting to PartyKit room "${room}" at host "${effectiveHost}"`);
      socket = new PartySocket({ host: effectiveHost, room });
      socket.binaryType = 'arraybuffer';

      socket.addEventListener('open', () => {
        connectionState = 2;
        history.replaceState(null, '', '#room=' + encodeURIComponent(room));
      });

      socket.addEventListener('message', (e) => {
        if (e.data instanceof ArrayBuffer) {
          incomingQueue.push(e.data);
        } else if (typeof e.data === 'string') {
          incomingQueue.push(new TextEncoder().encode(e.data).buffer);
        }
      });

      socket.addEventListener('close', () => { connectionState = 3; });
      socket.addEventListener('error', () => { connectionState = 3; });

      return 1;
    },

    ws_send: (dataPtr, size, flags) => {
      if (!socket || connectionState !== 2) return 0;
      socket.send(new Uint8Array(memory.buffer, dataPtr, size).slice());
      return 1;
    },

    ws_recv: (outPtr, maxSize) => {
      if (incomingQueue.length === 0) return 0;
      const msg = incomingQueue.shift();
      const bytes = new Uint8Array(msg);
      const toCopy = Math.min(bytes.length, maxSize);
      new Uint8Array(memory.buffer).set(bytes.subarray(0, toCopy), outPtr);
      return toCopy;
    },

    ws_get_state: () => connectionState,

    ws_disconnect: () => {
      if (socket) { socket.close(); socket = null; }
      connectionState = 0;
    },
  };
}

export function getRoomFromURL() {
  const match = location.hash.match(/room=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}
