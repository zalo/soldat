{  fphttpclient stub for WASM — no POSIX sockets  }
unit fphttpclient;
{$MODE DELPHI}
interface
uses Classes, SysUtils;

type
  TFPHTTPClient = class
  private
    FAllowRedirect: Boolean;
    FIOTimeout: Integer;
    FOnDataReceived: TNotifyEvent;
    FRequestBody: TStream;
    FResponseStatusCode: Integer;
  public
    constructor Create(AOwner: TComponent);
    destructor Destroy; override;
    procedure AddHeader(const Name, Value: string);
    procedure Get(const URL: string; const LocalFileName: string); overload;
    function Get(const URL: string): string; overload;
    procedure Post(const URL: string); overload;
    procedure Post(const URL: string; Response: TStream); overload;
    procedure Terminate;
    property AllowRedirect: Boolean read FAllowRedirect write FAllowRedirect;
    property IOTimeout: Integer read FIOTimeout write FIOTimeout;
    property OnDataReceived: TNotifyEvent read FOnDataReceived write FOnDataReceived;
    property RequestBody: TStream read FRequestBody write FRequestBody;
    property ResponseStatusCode: Integer read FResponseStatusCode;
  end;

implementation

constructor TFPHTTPClient.Create(AOwner: TComponent); begin FResponseStatusCode := 0; end;
destructor TFPHTTPClient.Destroy; begin inherited; end;
procedure TFPHTTPClient.AddHeader(const Name, Value: string); begin end;
procedure TFPHTTPClient.Get(const URL: string; const LocalFileName: string); begin end;
function TFPHTTPClient.Get(const URL: string): string; begin Result := ''; end;
procedure TFPHTTPClient.Post(const URL: string); begin end;
procedure TFPHTTPClient.Post(const URL: string; Response: TStream); begin end;
procedure TFPHTTPClient.Terminate; begin end;

end.
