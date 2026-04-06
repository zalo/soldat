{*******************************************************}
{  SDL2 Web Stub Unit for OpenSoldat                    }
{  Provides types and constants only — no actual SDL2    }
{  library calls. All SDL2 functions are no-ops or       }
{  return sensible defaults for the web target.          }
{*******************************************************}

unit sdl2;

{$MODE DELPHI}

interface

// ============================================================
// Types
// ============================================================

type
  TSDL_ScanCode = Word;
  TSDL_KeyCode = LongInt;

  PSDL_Window = Pointer;
  TSDL_GLContext = Pointer;

  PSDL_Surface = ^TSDL_Surface;
  TSDL_Surface = record
    flags: LongWord;
    w, h: LongInt;
    pitch: LongInt;
    pixels: Pointer;
  end;

  PSDL_RWops = Pointer;

  TSDL_DisplayMode = record
    format: LongWord;
    w, h, refresh_rate: LongInt;
    driverdata: Pointer;
  end;

  TSDL_AudioSpec = record
    freq: LongInt;
    format: Word;
    channels: Byte;
    silence: Byte;
    samples: Word;
    padding: Word;
    size: LongWord;
    callback: Pointer;
    userdata: Pointer;
  end;
  PSDL_AudioSpec = ^TSDL_AudioSpec;

  TSDL_KeySym = record
    scancode: TSDL_ScanCode;
    sym: TSDL_KeyCode;
    _mod: Word;
    unicode: LongWord;
  end;

  TSDL_KeyboardEvent = record
    type_: LongWord;
    timestamp: LongWord;
    windowID: LongWord;
    state: Byte;
    _repeat: Byte;
    padding2, padding3: Byte;
    keysym: TSDL_KeySym;
  end;

  TSDL_MouseMotionEvent = record
    type_: LongWord;
    timestamp: LongWord;
    windowID: LongWord;
    which: LongWord;
    state: LongWord;
    x, y, xrel, yrel: LongInt;
  end;

  TSDL_MouseButtonEvent = record
    type_: LongWord;
    timestamp: LongWord;
    windowID: LongWord;
    which: LongWord;
    button, state, clicks, padding1: Byte;
    x, y: LongInt;
  end;

  TSDL_TextInputEvent = record
    type_: LongWord;
    timestamp: LongWord;
    windowID: LongWord;
    text: array[0..31] of Char;
  end;

  TSDL_QuitEvent = record
    type_: LongWord;
    timestamp: LongWord;
  end;

  TSDL_Event = record
    case LongWord of
      0: (type_: LongWord);
      1: (key: TSDL_KeyboardEvent);
      2: (motion: TSDL_MouseMotionEvent);
      3: (button: TSDL_MouseButtonEvent);
      4: (text: TSDL_TextInputEvent);
      5: (quit: TSDL_QuitEvent);
      6: (padding: array[0..55] of Byte);
  end;

  TSDL_MessageBoxButtonData = record
    flags: LongWord;
    buttonid: LongInt;
    text: PChar;
  end;

  TSDL_MessageBoxData = record
    flags: LongWord;
    window: PSDL_Window;
    title: PChar;
    _message: PChar;
    numbuttons: LongInt;
    buttons: Pointer;
    colorScheme: Pointer;
  end;
  PSDL_MessageBoxData = ^TSDL_MessageBoxData;

// ============================================================
// Audio format constants
// ============================================================

const
  AUDIO_U8     = $0008;
  AUDIO_S16SYS = $8010;
  AUDIO_F32SYS = $8120;

// ============================================================
// SDL constants
// ============================================================

  SDL_INIT_VIDEO = $00000020;

  SDL_WINDOW_OPENGL              = $00000002;
  SDL_WINDOW_SHOWN               = $00000004;
  SDL_WINDOW_FULLSCREEN          = $00000001;
  SDL_WINDOW_FULLSCREEN_DESKTOP  = $00001001;
  SDL_WINDOW_INPUT_FOCUS         = $00000200;
  SDL_WINDOWPOS_UNDEFINED        = $1FFF0000;

  SDL_GL_CONTEXT_MAJOR_VERSION   = 17;
  SDL_GL_CONTEXT_MINOR_VERSION   = 18;
  SDL_GL_CONTEXT_PROFILE_MASK    = 21;
  SDL_GL_CONTEXT_PROFILE_ES      = $0004;
  SDL_GL_MULTISAMPLEBUFFERS      = 13;
  SDL_GL_MULTISAMPLESAMPLES      = 14;
  SDL_GL_DOUBLEBUFFER            = 5;
  SDL_GL_DEPTH_SIZE              = 6;

  SDL_TRUE  = 1;
  SDL_FALSE = 0;

  // Event types
  SDL_QUITEV         = $100;
  SDL_KEYDOWN        = $300;
  SDL_KEYUP          = $301;
  SDL_TEXTINPUT      = $303;
  SDL_MOUSEMOTION    = $400;
  SDL_MOUSEBUTTONDOWN= $401;
  SDL_MOUSEBUTTONUP  = $402;

  // Scancodes (subset used by the game)
  SDL_SCANCODE_0     = 39;
  SDL_SCANCODE_1     = 30;
  SDL_SCANCODE_2     = 31;
  SDL_SCANCODE_3     = 32;
  SDL_SCANCODE_ESCAPE   = 41;
  SDL_SCANCODE_F4       = 61;
  SDL_SCANCODE_F8       = 65;
  SDL_SCANCODE_F9       = 66;
  SDL_SCANCODE_F10      = 67;
  SDL_SCANCODE_F11      = 68;
  SDL_SCANCODE_F12      = 69;
  SDL_SCANCODE_PAGEUP   = 75;
  SDL_SCANCODE_PAGEDOWN = 78;

  // Keycodes (SDLK_*)
  SDLK_RETURN    = 13;
  SDLK_ESCAPE    = 27;
  SDLK_BACKSPACE = 8;
  SDLK_TAB       = 9;
  SDLK_DELETE     = 127;
  SDLK_INSERT     = 277;
  SDLK_HOME       = 278;
  SDLK_END        = 279;
  SDLK_RIGHT      = 275;
  SDLK_LEFT       = 276;
  SDLK_KP_ENTER   = 271;
  SDLK_c          = Ord('c');
  SDLK_v          = Ord('v');

  // Key modifiers
  KMOD_NONE  = $0000;
  KMOD_LSHIFT = $0001;
  KMOD_RSHIFT = $0002;
  KMOD_LCTRL  = $0040;
  KMOD_RCTRL  = $0080;
  KMOD_LALT   = $0100;
  KMOD_RALT   = $0200;
  KMOD_CTRL   = KMOD_LCTRL or KMOD_RCTRL;
  KMOD_SHIFT  = KMOD_LSHIFT or KMOD_RSHIFT;
  KMOD_ALT    = KMOD_LALT or KMOD_RALT;

  // MessageBox flags
  SDL_MESSAGEBOX_ERROR = $10;
  SDL_MESSAGEBOX_BUTTON_RETURNKEY_DEFAULT = $01;
  SDL_MESSAGEBOX_BUTTON_ESCAPEKEY_DEFAULT = $02;

// ============================================================
// Stub functions — all no-ops for web target
// ============================================================

function SDL_Init(flags: LongWord): LongInt;
procedure SDL_Quit;
function SDL_GetError(): PChar;

function SDL_CreateWindow(title: PChar; x, y, w, h: LongInt; flags: LongWord): PSDL_Window;
procedure SDL_MinimizeWindow(window: PSDL_Window);
function SDL_GetWindowFlags(window: PSDL_Window): LongWord;
procedure SDL_SetWindowIcon(window: PSDL_Window; icon: PSDL_Surface);

function SDL_GL_SetAttribute(attr: LongInt; value: LongInt): LongInt;
function SDL_GL_CreateContext(window: PSDL_Window): TSDL_GLContext;
function SDL_GL_MakeCurrent(window: PSDL_Window; context: TSDL_GLContext): LongInt;
procedure SDL_GL_SwapWindow(window: PSDL_Window);
function SDL_GL_SetSwapInterval(interval: LongInt): LongInt;

function SDL_PollEvent(event: Pointer): LongInt;
function SDL_GetCurrentDisplayMode(displayIndex: LongInt; mode: Pointer): LongInt;

function SDL_GetBasePath(): PChar;
function SDL_GetPrefPath(org, app: PChar): PChar;
function SDL_GetPerformanceCounter(): Int64; cdecl; external 'env' name 'sdl_get_performance_counter';
function SDL_GetPerformanceFrequency(): Int64; cdecl; external 'env' name 'sdl_get_performance_frequency';

procedure SDL_SetRelativeMouseMode(enabled: LongInt);
procedure SDL_StartTextInput;
procedure SDL_StopTextInput;
function SDL_GetScancodeFromName(name: PChar): TSDL_ScanCode;

function SDL_GetClipboardText(): PChar;
function SDL_SetClipboardText(text: PChar): LongInt;

function SDL_RWFromMem(mem: Pointer; size: LongInt): PSDL_RWops;
function SDL_LoadBMP_RW(src: PSDL_RWops; freesrc: LongInt): PSDL_Surface;
function SDL_LoadWAV_RW(src: PSDL_RWops; freesrc: LongInt; spec: PSDL_AudioSpec; audio_buf: PPointer; audio_len: PLongWord): PSDL_AudioSpec;
procedure SDL_FreeWAV(audio_buf: Pointer);
procedure SDL_FreeSurface(surface: PSDL_Surface);

function SDL_ShowMessageBox(messageboxdata: PSDL_MessageBoxData; buttonid: PLongInt): LongInt;
function SDL_ShowSimpleMessageBox(flags: LongWord; title, message_: PChar; window: PSDL_Window): LongInt;
function SDL_GetModState(): LongInt;
function SDL_GetTicks(): LongWord;

implementation
uses SysUtils;

// All functions are stubs — actual functionality handled by JS bridge

function SDL_Init(flags: LongWord): LongInt;
begin Result := 0; end;

procedure SDL_Quit; begin end;

function SDL_GetError(): PChar;
begin Result := ''; end;

function SDL_CreateWindow(title: PChar; x, y, w, h: LongInt; flags: LongWord): PSDL_Window;
begin Result := Pointer(1); end; // non-null dummy

procedure SDL_MinimizeWindow(window: PSDL_Window); begin end;

function SDL_GetWindowFlags(window: PSDL_Window): LongWord;
begin Result := SDL_WINDOW_INPUT_FOCUS or SDL_WINDOW_SHOWN; end;

procedure SDL_SetWindowIcon(window: PSDL_Window; icon: PSDL_Surface); begin end;

function SDL_GL_SetAttribute(attr: LongInt; value: LongInt): LongInt;
begin Result := 0; end;

function SDL_GL_CreateContext(window: PSDL_Window): TSDL_GLContext;
begin Result := Pointer(1); end;

function SDL_GL_MakeCurrent(window: PSDL_Window; context: TSDL_GLContext): LongInt;
begin Result := 0; end;

procedure SDL_GL_SwapWindow(window: PSDL_Window); begin end;

function SDL_GL_SetSwapInterval(interval: LongInt): LongInt;
begin Result := 0; end;

function SDL_PollEvent(event: Pointer): LongInt;
begin Result := 0; end; // No events — input handled by JS bridge

function SDL_GetCurrentDisplayMode(displayIndex: LongInt; mode: Pointer): LongInt;
var m: ^TSDL_DisplayMode;
begin
  m := mode;
  m^.w := 1920; m^.h := 1080; m^.refresh_rate := 60; m^.format := 0;
  Result := 0;
end;

function SDL_GetBasePath(): PChar;
begin Result := '/'; end;

function SDL_GetPrefPath(org, app: PChar): PChar;
begin Result := '/'; end;

// SDL_GetPerformanceCounter and SDL_GetPerformanceFrequency are
// WASM imports — implemented in JS bridge

procedure SDL_SetRelativeMouseMode(enabled: LongInt); begin end;
procedure SDL_StartTextInput; begin end;
procedure SDL_StopTextInput; begin end;

function SDL_GetScancodeFromName(name: PChar): TSDL_ScanCode;
var s: string; i: Integer;
begin
  // Map key names to SDL2 scancodes matching web/input.js SDL_SCANCODES
  Result := 0;
  s := LowerCase(string(name));
  if Length(s) = 1 then
  begin
    if (s[1] >= 'a') and (s[1] <= 'z') then
      Result := $04 + Ord(s[1]) - Ord('a')  // a=0x04 .. z=0x1D
    else if (s[1] >= '1') and (s[1] <= '9') then
      Result := $1E + Ord(s[1]) - Ord('1')  // 1=0x1E .. 9=0x26
    else if s[1] = '0' then
      Result := $27;
  end
  else if s = 'space' then Result := $2C
  else if s = 'return' then Result := $28
  else if s = 'escape' then Result := $29
  else if s = 'backspace' then Result := $2A
  else if s = 'tab' then Result := $2B
  else if s = 'up' then Result := $52
  else if s = 'down' then Result := $51
  else if s = 'left' then Result := $50
  else if s = 'right' then Result := $4F
  else if s = 'lshift' then Result := $E1
  else if s = 'rshift' then Result := $E5
  else if s = 'lctrl' then Result := $E0
  else if s = 'rctrl' then Result := $E4
  else if s = 'lalt' then Result := $E2
  else if s = 'ralt' then Result := $E6
  else if s = '/' then Result := $38
  else if s = '.' then Result := $37
  else if s = ',' then Result := $36
  else if s = '-' then Result := $2D
  else if s = '=' then Result := $2E
  else if s = '[' then Result := $2F
  else if s = ']' then Result := $30
  else if s = '`' then Result := $35
  else if (Length(s) >= 2) and (s[1] = 'f') then
  begin
    // F1-F12
    i := StrToIntDef(Copy(s, 2, 2), 0);
    if (i >= 1) and (i <= 12) then
      Result := Word($39 + i);
  end;
end;

function SDL_GetClipboardText(): PChar;
begin Result := ''; end;

function SDL_SetClipboardText(text: PChar): LongInt;
begin Result := 0; end;

function SDL_RWFromMem(mem: Pointer; size: LongInt): PSDL_RWops;
begin Result := mem; end; // Just pass the pointer through

function SDL_LoadBMP_RW(src: PSDL_RWops; freesrc: LongInt): PSDL_Surface;
begin Result := nil; end;

function SDL_LoadWAV_RW(src: PSDL_RWops; freesrc: LongInt; spec: PSDL_AudioSpec; audio_buf: PPointer; audio_len: PLongWord): PSDL_AudioSpec;
begin Result := nil; end;

procedure SDL_FreeWAV(audio_buf: Pointer); begin end;
procedure SDL_FreeSurface(surface: PSDL_Surface); begin end;

function SDL_ShowMessageBox(messageboxdata: PSDL_MessageBoxData; buttonid: PLongInt): LongInt;
begin Result := 0; end;

function SDL_ShowSimpleMessageBox(flags: LongWord; title, message_: PChar; window: PSDL_Window): LongInt;
begin Result := 0; end;

function SDL_GetModState(): LongInt;
begin Result := 0; end;

function SDL_GetTicks(): LongWord;
begin Result := 0; end;

end.
