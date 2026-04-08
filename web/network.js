// web/network.js — WebSocket networking via PartySocket + room URL management
import PartySocket from './lib/partysocket.js';

export function createNetworkBridge(memory) {
  let socket = null;
  const incomingQueue = []; // ArrayBuffer[]
  let connectionState = 0; // 0=none, 1=connecting, 2=connected, 3=closed
  const pendingSends = []; // Messages queued while connecting

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
        console.log(`[ws] Connected to room "${room}"`);
        history.replaceState(null, '', '#room=' + encodeURIComponent(room));
        // Flush any messages queued while connecting
        while (pendingSends.length > 0) {
          socket.send(pendingSends.shift());
        }
      });

      socket.addEventListener('message', (e) => {
        if (e.data instanceof ArrayBuffer) {
          incomingQueue.push(e.data);
          if (incomingQueue.length <= 5)
            console.log(`[ws] Recv binary: ${e.data.byteLength} bytes, queue=${incomingQueue.length}, id=${new Uint8Array(e.data)[0]}`);
        } else if (typeof e.data === 'string') {
          incomingQueue.push(new TextEncoder().encode(e.data).buffer);
          console.log(`[ws] Recv text: "${e.data.substring(0, 60)}", queue=${incomingQueue.length}`);
        } else if (e.data instanceof Blob) {
          // Handle Blob data (some WebSocket implementations use Blob)
          e.data.arrayBuffer().then(ab => {
            incomingQueue.push(ab);
            console.log(`[ws] Recv blob→AB: ${ab.byteLength} bytes, queue=${incomingQueue.length}`);
          });
        }
      });

      socket.addEventListener('close', () => { connectionState = 3; });
      socket.addEventListener('error', () => { connectionState = 3; });

      return 1;
    },

    ws_send: (dataPtr, size, flags) => {
      if (!socket) return 0;
      const data = new Uint8Array(memory.buffer, dataPtr, size).slice();
      if (connectionState === 2) {
        socket.send(data);
      } else if (connectionState === 1) {
        // Queue until connected
        pendingSends.push(data);
      } else {
        return 0;
      }
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
