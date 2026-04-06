{  SyncObjs stub for WASM — no threading available  }
unit SyncObjs;
{$MODE DELPHI}
interface

type
  TCriticalSection = class
    procedure Enter;
    procedure Leave;
    procedure Acquire;
    procedure Release;
    constructor Create;
    destructor Destroy; override;
  end;

  TEvent = class
    constructor Create(EventAttributes: Pointer; ManualReset, InitialState: Boolean; const Name: string);
    procedure SetEvent;
    procedure ResetEvent;
    function WaitFor(Timeout: LongWord): LongWord;
    destructor Destroy; override;
  end;

const
  wrSignaled  = 0;
  wrTimeout   = 1;
  wrAbandoned = 2;
  wrError     = 3;
  INFINITE    = LongWord($FFFFFFFF);

implementation

constructor TCriticalSection.Create; begin end;
destructor TCriticalSection.Destroy; begin inherited; end;
procedure TCriticalSection.Enter; begin end;
procedure TCriticalSection.Leave; begin end;
procedure TCriticalSection.Acquire; begin end;
procedure TCriticalSection.Release; begin end;

constructor TEvent.Create(EventAttributes: Pointer; ManualReset, InitialState: Boolean; const Name: string); begin end;
destructor TEvent.Destroy; begin inherited; end;
procedure TEvent.SetEvent; begin end;
procedure TEvent.ResetEvent; begin end;
function TEvent.WaitFor(Timeout: LongWord): LongWord; begin Result := wrSignaled; end;

end.
