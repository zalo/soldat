{  fphttpserver stub for WASM — no POSIX sockets  }
unit fphttpserver;
{$MODE DELPHI}
interface
uses Classes;

type
  TFPHTTPConnectionRequest = class end;
  TFPHTTPConnectionResponse = class end;
  THTTPServerRequestHandler = procedure(Sender: TObject;
    var ARequest: TFPHTTPConnectionRequest;
    var AResponse: TFPHTTPConnectionResponse) of object;

  TFPHTTPServer = class
  private
    FPort: Word;
    FActive: Boolean;
    FAddress: string;
    FConnectionCount: Integer;
    FOnRequest: THTTPServerRequestHandler;
  public
    property Port: Word read FPort write FPort;
    property Active: Boolean read FActive write FActive;
    property Address: string read FAddress write FAddress;
    property ConnectionCount: Integer read FConnectionCount;
    property OnRequest: THTTPServerRequestHandler read FOnRequest write FOnRequest;
  end;

implementation
end.
