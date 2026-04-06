{  BaseUnix stub for WASM — no POSIX signals/process API  }
unit BaseUnix;
{$MODE DELPHI}
interface

type
  cint = LongInt;
  TPid = LongInt;
  TSignalHandler = procedure(sig: cint); cdecl;

const
  SIGTERM = 15;
  SIGINT  = 2;
  SIGQUIT = 3;
  SIGPIPE = 13;
  SIG_IGN: TSignalHandler = nil;

function FpSignal(signum: cint; handler: TSignalHandler): TSignalHandler;
function FpGetPid(): LongInt;
function FpFork(): TPid;
procedure FpExit(status: cint);
function FpSetsid(): TPid;
function FpUmask(cmask: LongWord): LongWord;

implementation

function FpSignal(signum: cint; handler: TSignalHandler): TSignalHandler;
begin Result := nil; end;

function FpGetPid(): LongInt;
begin Result := 1; end;

function FpFork(): TPid;
begin Result := 0; end; // pretend we're the child

procedure FpExit(status: cint);
begin end;

function FpSetsid(): TPid;
begin Result := 1; end;

function FpUmask(cmask: LongWord): LongWord;
begin Result := 0; end;

end.
