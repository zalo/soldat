{*********************************************************}
{                                                         }
{   Soldatserver                                          }
{                                                         }
{   Copyright (c) 2001 Michal Marcinkowski                }
{                                                         }
{*********************************************************}

program soldatserver;

{$IFDEF DARWIN}
{$linklib physfs}
{$linklib GameNetworkingSockets}
{$ENDIF}

uses
  {$IFNDEF WINDOWS}
  cthreads, // needs to be first included unit in project
  {$ENDIF}
  {$IFDEF AUTOUPDATER}
  AutoUpdater,
  {$ENDIF}
  {$IFDEF WEB}SysUtils, Server, ServerLoop, Net, Game, Sprites, Constants, Weapons,{$ENDIF}
  Main in 'Main.pas';

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

{$IFDEF WEB}
// Imported from JS — throws to abort _start cleanly without running finalizers
procedure web_stop(); cdecl; external 'env';

procedure server_init(); cdecl; export;
begin
  DefaultSystemCodePage := CP_UTF8;
  ActivateServer;
  if ProgReady then
    StartServer;
end;

procedure server_tick(); cdecl; export;
begin
  if ProgReady then
    AppOnIdle;
end;

procedure server_on_connect(connId: LongInt); cdecl; export;
begin
  WebServerOnConnect(connId);
end;

procedure server_on_message(connId: LongInt; dataPtr: Pointer; dataLen: LongInt); cdecl; export;
begin
  WebServerOnMessage(connId, dataPtr, dataLen);
end;

procedure server_on_disconnect(connId: LongInt); cdecl; export;
begin
  WebServerOnDisconnect(connId);
end;

function server_get_outbound(outPtr: Pointer; maxSize: LongInt): LongInt; cdecl; export;
begin
  Result := WebServerGetOutbound(outPtr, maxSize);
end;

function alloc_buffer(size: LongWord): Pointer; cdecl; export;
begin
  GetMem(Result, size);
end;

exports
  server_init, server_tick,
  server_on_connect, server_on_message, server_on_disconnect,
  server_get_outbound, alloc_buffer;
{$ENDIF}

begin
  {$IFDEF WEB}
  server_init;
  web_stop;
  {$ELSE}
  {$IFDEF AUTOUPDATER}
  StartAutoUpdater;
  {$ENDIF}
  RunServer;

  DefaultSystemCodePage := CP_UTF8;
  {$ENDIF}
end.
