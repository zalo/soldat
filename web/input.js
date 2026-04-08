// web/input.js — Keyboard, mouse (PointerLock), and touch joystick input

// SDL2 scancode mapping for common keys
const SDL_SCANCODES = {
  'KeyA': 0x04, 'KeyB': 0x05, 'KeyC': 0x06, 'KeyD': 0x07,
  'KeyE': 0x08, 'KeyF': 0x09, 'KeyG': 0x0A, 'KeyH': 0x0B,
  'KeyI': 0x0C, 'KeyJ': 0x0D, 'KeyK': 0x0E, 'KeyL': 0x0F,
  'KeyM': 0x10, 'KeyN': 0x11, 'KeyO': 0x12, 'KeyP': 0x13,
  'KeyQ': 0x14, 'KeyR': 0x15, 'KeyS': 0x16, 'KeyT': 0x17,
  'KeyU': 0x18, 'KeyV': 0x19, 'KeyW': 0x1A, 'KeyX': 0x1B,
  'KeyY': 0x1C, 'KeyZ': 0x1D,
  'Digit1': 0x1E, 'Digit2': 0x1F, 'Digit3': 0x20, 'Digit4': 0x21,
  'Digit5': 0x22, 'Digit6': 0x23, 'Digit7': 0x24, 'Digit8': 0x25,
  'Digit9': 0x26, 'Digit0': 0x27,
  'Enter': 0x28, 'Escape': 0x29, 'Backspace': 0x2A, 'Tab': 0x2B,
  'Space': 0x2C, 'Minus': 0x2D, 'Equal': 0x2E,
  'BracketLeft': 0x2F, 'BracketRight': 0x30,
  'Semicolon': 0x33, 'Quote': 0x34, 'Backquote': 0x35,
  'Comma': 0x36, 'Period': 0x37, 'Slash': 0x38,
  'F1': 0x3A, 'F2': 0x3B, 'F3': 0x3C, 'F4': 0x3D,
  'F5': 0x3E, 'F6': 0x3F, 'F7': 0x40, 'F8': 0x41,
  'F9': 0x42, 'F10': 0x43, 'F11': 0x44, 'F12': 0x45,
  'ArrowRight': 0x4F, 'ArrowLeft': 0x50, 'ArrowDown': 0x51, 'ArrowUp': 0x52,
  'ShiftLeft': 0xE1, 'ShiftRight': 0xE5,
  'ControlLeft': 0xE0, 'ControlRight': 0xE4,
  'AltLeft': 0xE2, 'AltRight': 0xE6,
};

// Mouse button indices: Pascal uses KeyStatus[300 + SDL_button_number]
// SDL: left=1, middle=2, right=3. DOM: left=0, middle=1, right=2.
const MOUSE_LEFT = 301;   // 300 + SDL button 1
const MOUSE_MIDDLE = 302; // 300 + SDL button 2
const MOUSE_RIGHT = 303;  // 300 + SDL button 3

export function createInputBridge(memory, canvas) {
  let keyStatePtr = 0;
  let mouseDeltaPtr = 0;
  let moveStickPtr = 0;
  let aimStickPtr = 0;

  const isTouchDevice = ('ontouchstart' in window) && navigator.maxTouchPoints > 0;

  // --- Keyboard ---
  function isInputFocused() {
    const el = document.activeElement;
    return el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
  }

  document.addEventListener('keydown', (e) => {
    if (!keyStatePtr || isInputFocused()) return;
    const sc = SDL_SCANCODES[e.code];
    if (sc !== undefined) {
      new Uint8Array(memory.buffer)[keyStatePtr + sc] = 1;
      e.preventDefault();
    }
  });

  document.addEventListener('keyup', (e) => {
    if (!keyStatePtr || isInputFocused()) return;
    const sc = SDL_SCANCODES[e.code];
    if (sc !== undefined) {
      new Uint8Array(memory.buffer)[keyStatePtr + sc] = 0;
      e.preventDefault();
    }
  });

  // --- Mouse (PointerLock) ---
  if (!isTouchDevice) {
    canvas.addEventListener('click', () => {
      // Don't capture mouse if lobby overlay is visible
      const lobby = document.getElementById('lobby');
      if (lobby && lobby.style.display !== 'none') return;
      if (!document.pointerLockElement) canvas.requestPointerLock();
    });

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas || !mouseDeltaPtr) return;
      const dv = new DataView(memory.buffer);
      dv.setFloat32(mouseDeltaPtr,     dv.getFloat32(mouseDeltaPtr, true) + e.movementX, true);
      dv.setFloat32(mouseDeltaPtr + 4, dv.getFloat32(mouseDeltaPtr + 4, true) + e.movementY, true);
    });

    document.addEventListener('mousedown', (e) => {
      if (document.pointerLockElement !== canvas || !keyStatePtr) return;
      const mem = new Uint8Array(memory.buffer);
      if (e.button === 0) mem[keyStatePtr + MOUSE_LEFT] = 1;
      if (e.button === 2) mem[keyStatePtr + MOUSE_RIGHT] = 1;
    });

    document.addEventListener('mouseup', (e) => {
      if (!keyStatePtr) return;
      const mem = new Uint8Array(memory.buffer);
      if (e.button === 0) mem[keyStatePtr + MOUSE_LEFT] = 0;
      if (e.button === 2) mem[keyStatePtr + MOUSE_RIGHT] = 0;
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  // --- Touch Joysticks ---
  if (isTouchDevice) {
    document.getElementById('touch-controls').classList.add('visible');
    setupJoystick('stick-left-zone', 'stick-left-knob', (sx, sy) => {
      if (!moveStickPtr) return;
      const view = new Int8Array(memory.buffer);
      view[moveStickPtr] = sx;
      view[moveStickPtr + 1] = sy;
    });
    setupJoystick('stick-right-zone', 'stick-right-knob', (sx, sy) => {
      if (!aimStickPtr) return;
      const view = new Int8Array(memory.buffer);
      view[aimStickPtr] = sx;
      view[aimStickPtr + 1] = sy;
    });
    setupTouchButtons();

    // Canvas tap → mouse click (for weapon menu, UI interactions)
    canvas.addEventListener('touchstart', (e) => {
      if (!keyStatePtr) return;
      const mem = new Uint8Array(memory.buffer);
      mem[keyStatePtr + MOUSE_LEFT] = 1;
    }, { passive: true });
    canvas.addEventListener('touchend', () => {
      if (!keyStatePtr) return;
      const mem = new Uint8Array(memory.buffer);
      mem[keyStatePtr + MOUSE_LEFT] = 0;
    });
  }

  function setupJoystick(zoneId, knobId, onMove) {
    const zone = document.getElementById(zoneId);
    const knob = document.getElementById(knobId);
    const maxRadius = 50;
    let activeTouch = null;

    zone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      if (activeTouch !== null) return;
      activeTouch = e.changedTouches[0].identifier;
      handleMove(e.changedTouches[0]);
    }, { passive: false });

    zone.addEventListener('touchmove', (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) { handleMove(t); break; }
      }
    }, { passive: false });

    const endTouch = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) {
          activeTouch = null;
          knob.style.transform = 'translate(-50%, -50%)';
          onMove(0, 0);
          break;
        }
      }
    };
    zone.addEventListener('touchend', endTouch);
    zone.addEventListener('touchcancel', endTouch);

    function handleMove(touch) {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = touch.clientX - cx;
      let dy = touch.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRadius) { dx = dx / dist * maxRadius; dy = dy / dist * maxRadius; }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      onMove(Math.round(dx / maxRadius * 127), Math.round(dy / maxRadius * 127));
    }
  }

  function setupTouchButtons() {
    const btnMap = {
      'btn-fire':     MOUSE_LEFT,       // mouse1 → +fire
      'btn-jump':     0x2C,             // Space → +jet (button activates jets; jumping is stick-up)
      'btn-reload':   0x15,             // R → +reload
      'btn-throw':    0x0A,             // G → +throwgrenade
      'btn-wpn-next': 0x14,             // Q → +changeweapon
    };
    for (const [id, scancode] of Object.entries(btnMap)) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        el.classList.add('pressed');
        if (keyStatePtr) new Uint8Array(memory.buffer)[keyStatePtr + scancode] = 1;
      }, { passive: false });
      const release = () => {
        el.classList.remove('pressed');
        if (keyStatePtr) new Uint8Array(memory.buffer)[keyStatePtr + scancode] = 0;
      };
      el.addEventListener('touchend', release);
      el.addEventListener('touchcancel', release);
    }
  }

  return {
    input_set_pointers: (keyState, mouseDelta, moveStick, aimStick) => {
      keyStatePtr = keyState;
      mouseDeltaPtr = mouseDelta;
      moveStickPtr = moveStick;
      aimStickPtr = aimStick;
    },
    input_is_touch_device: () => isTouchDevice ? 1 : 0,
    input_get_canvas_size: (wPtr, hPtr) => {
      const dv = new DataView(memory.buffer);
      dv.setInt32(wPtr, canvas.width, true);
      dv.setInt32(hPtr, canvas.height, true);
    },
  };
}
