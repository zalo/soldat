{*******************************************************}
{                                                       }
{       SOLDAT                                          }
{                                                       }
{       Copyright (c) 2001 Michal Marcinkowski          }
{                                                       }
{*******************************************************}

program soldat;

{$IFDEF MSWINDOWS}
{$APPTYPE CONSOLE}
{$ENDIF}

{$IFDEF DARWIN}
{$linklib freetype}
{$linklib stb}
{$linklib physfs}
{$linklib GameNetworkingSockets}
{$ENDIF}

uses
  {$IFDEF UNIX}
  cthreads,
  cwstring,
  {$ENDIF}
  {$IFDEF MSWINDOWS}Windows,{$ENDIF}
  SysUtils,
  {$IFDEF AUTOUPDATER}AutoUpdater,{$ENDIF}
  {$IFDEF WEB}ClientGame, ControlGame, Net, Game, GameRendering, dglOpenGL, Constants, Math, Gfx, Sprites,{$ENDIF}
  Client in 'Client.pas';

{$IFDEF MSWINDOWS}
const
  {$IFNDEF DEBUG}
    IMAGE_DLLCHARACTERISTICS_NX_COMPAT = $0100;
    {$SetPEOptFlags IMAGE_DLLCHARACTERISTICS_NX_COMPAT}

    IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE = $0040;
    {$SetPEOptFlags IMAGE_DLLCHARACTERISTICS_DYNAMIC_BASE}

    {$IFDEF CPU64}
      IMAGE_DLLCHARACTERISTICS_HIGH_ENTROPY_VA = $0020;
      {$SetPEOptFlags IMAGE_DLLCHARACTERISTICS_HIGH_ENTROPY_VA}
    {$ENDIF}
  {$ENDIF}
  IMAGE_DLLCHARACTERISTICS_TERMINAL_SERVER_AWARE = $8000;
  {$SetPEOptFlags IMAGE_DLLCHARACTERISTICS_TERMINAL_SERVER_AWARE}
{$ENDIF MSWINDOWS}

{$IFDEF MSWINDOWS}
{$R *.res}
{$ENDIF}

{$IFDEF WEB}
// Imported from JS — throws to abort _start cleanly without running finalizers
procedure web_stop(); cdecl; external 'env';

procedure web_debug_checkpoint(id: LongInt); cdecl; external 'env';

procedure web_init(); cdecl; export;
begin
  DefaultSystemCodePage := CP_UTF8;
  StartGame;
end;

var
  WebTickCount: LongInt = 0;
  WebTickInitialized: Boolean = False;

procedure web_tick(); cdecl; export;
begin
  ShouldRenderFrames := True;
  if not WebTickInitialized then
  begin
    WebTickInitialized := True;
    r_fpslimit.SetValue(False);
    ResetFrameTiming;
  end;

  // Force camera to map center when no player sprite exists
  if MySprite = 0 then
  begin
    CameraX := 400;
    CameraY := 350;
  end
  else
  begin
    // Keep controls active without a server (normally reset by server heartbeat)
    ClientStopMovingCounter := 90;
    NoHeartbeatTime := 0;
  end;

  // Load textures incrementally
  DoTextureLoading(False);

  // try/except required: FPC wasm32 exception handling needs an active frame
  // or unhandled exceptions from message handlers silently abort web_tick
  try
    if Assigned(UDP) then
      UDP.ProcessLoop;
    GameInput;
    GameLoop;
  except
    on E: Exception do
      WriteLn('[web_tick] Exception: ', E.ClassName, ': ', E.Message);
  end;

  // Force render on web
  RenderFrame(0, 0, MapChangeCounter >= 0);
  Inc(WebTickCount);
  if (WebTickCount <= 3) or (WebTickCount mod 300 = 0) then
    WriteLn('[web_tick] #' + IntToStr(WebTickCount) +
      ' MySprite=' + IntToStr(MySprite) +
      ' ProgReady=' + IntToStr(Ord(ProgReady)) +
      ' GameLoopRun=' + IntToStr(Ord(GameLoopRun)) +
      ' MapChange=' + IntToStr(MapChangeCounter));
end;

function web_alloc(size: LongWord): Pointer; cdecl; export;
begin
  GetMem(Result, size);
end;

procedure web_free(p: Pointer); cdecl; export;
begin
  FreeMem(p);
end;

procedure web_resize(w, h: LongInt); cdecl; export;
var fov: Single;
begin
  WindowWidth := w;
  WindowHeight := h;
  ScreenWidth := w;
  ScreenHeight := h;
  RenderWidth := w;
  RenderHeight := h;

  fov := RenderWidth / RenderHeight;
  if fov > MAX_FOV then
    RenderWidth := Ceil(RenderHeight * MAX_FOV)
  else if fov < MIN_FOV then
    RenderHeight := Ceil(RenderWidth / MIN_FOV);

  fov := RenderWidth / RenderHeight;
  GameWidth := Round(fov * GameHeight);
  GameWidthHalf := GameWidth / 2;
  GameHeightHalf := GameHeight / 2;

  GfxViewport(0, 0, WindowWidth, WindowHeight);
end;

procedure join_room(roomPtr: PChar); cdecl; export;
begin
  JoinIP := String(roomPtr);
  JoinPort := '0';
  WriteLn('[web] Joining room: ', JoinIP);
  JoinServer();
end;

procedure web_spawn_offline(); cdecl; export;
begin
  WebSpawnOfflinePlayer();
  WriteLn('[web] Offline player spawned');
end;

// Accessibility: query game state for automated testing
function web_get_my_sprite(): LongInt; cdecl; export;
begin
  Result := MySprite;
end;

function web_get_map_change_counter(): LongInt; cdecl; export;
begin
  Result := MapChangeCounter;
end;

function web_get_requesting_game(): LongInt; cdecl; export;
begin
  Result := Ord(RequestingGame);
end;

function web_get_connection_state(): LongInt; cdecl; export;
begin
  if UDP = nil then Result := 0
  else if UDP.Active then Result := 2
  else Result := 1;
end;

function web_get_camera_x(): Single; cdecl; export;
begin Result := CameraX; end;
function web_get_camera_y(): Single; cdecl; export;
begin Result := CameraY; end;

// Set cursor position from touch coordinates (0..1 normalized)
procedure web_set_cursor(normX, normY: Single); cdecl; export;
begin
  mx := normX * GameWidth;
  my := normY * GameHeight;
end;

function web_get_game_width(): LongInt; cdecl; export;
begin Result := GameWidth; end;
function web_get_game_height(): LongInt; cdecl; export;
begin Result := GameHeight; end;

exports web_init, web_tick, web_alloc, web_free, web_resize, join_room, web_spawn_offline,
  web_get_my_sprite, web_get_map_change_counter, web_get_requesting_game, web_get_connection_state,
  web_get_camera_x, web_get_camera_y, web_set_cursor, web_get_game_width, web_get_game_height;
{$ENDIF}

begin
  {$IFDEF WEB}
  DefaultSystemCodePage := CP_UTF8;
  StartGame;
  // CRITICAL: We must exit WASM here BEFORE FPC's implicit Halt(0) runs,
  // because Halt runs unit finalization sections that destroy all global
  // objects (spritesheets, textures, map data, etc.) BEFORE calling proc_exit.
  // Call web_stop (imported JS function) which throws to abort cleanly.
  web_stop();
  {$ELSE}
  {$IFDEF AUTOUPDATER}
  StartAutoUpdater;
  {$ENDIF}

  DefaultSystemCodePage := CP_UTF8;

  StartGame;
  {$ENDIF}
end.
