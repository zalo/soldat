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
  {$IFDEF WEB}ClientGame, ControlGame, Net, Game, GameRendering, dglOpenGL, Constants, Math, Gfx,{$ENDIF}
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
  if Assigned(UDP) then
    UDP.ProcessLoop;
  GameInput;

  GameLoop;
  Inc(WebTickCount);
  if (WebTickCount <= 3) or (WebTickCount mod 300 = 0) then
    WriteLn('[web_tick] #', WebTickCount,
      ' TickTime=', TickTime,
      ' TickTimeLast=', TickTimeLast,
      ' MapChangeCounter=', MapChangeCounter);
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

exports web_init, web_tick, web_alloc, web_free, web_resize;
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
