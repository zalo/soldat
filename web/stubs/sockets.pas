{  Sockets stub for WASM — no POSIX sockets available  }
unit Sockets;
{$MODE DELPHI}
interface

type
  TSocket = LongInt;
  TInetSockAddr = record
    sin_family: Word;
    sin_port: Word;
    sin_addr: LongWord;
    sin_zero: array[0..7] of Byte;
  end;
  TSockAddr = TInetSockAddr;

  in_addr = record
    s_addr: LongWord;
  end;

const
  INVALID_SOCKET = TSocket(-1);

function NetAddrToStr(addr: in_addr): string;
function StrToNetAddr(s: string): in_addr;

implementation

function NetAddrToStr(addr: in_addr): string;
begin
  Result := '0.0.0.0';
end;

function StrToNetAddr(s: string): in_addr;
begin
  Result.s_addr := 0;
end;

end.
