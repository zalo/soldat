program render_test;
{$mode delphi}

// Declare GL imports directly for this standalone test
procedure glClearColor(r, g, b, a: Single); cdecl; external 'env';
procedure glClear(mask: LongWord); cdecl; external 'env';
procedure glViewport(x, y, w, h: LongInt); cdecl; external 'env';
procedure glEnable(cap: LongWord); cdecl; external 'env';
procedure glBlendFunc(sfactor, dfactor: LongWord); cdecl; external 'env';

const
  GL_COLOR_BUFFER_BIT = $00004000;
  GL_BLEND = $0BE2;
  GL_ONE = 1;
  GL_ONE_MINUS_SRC_ALPHA = $0303;

var
  FrameCount: LongInt = 0;

procedure init(); export;
begin
  glEnable(GL_BLEND);
  glBlendFunc(GL_ONE, GL_ONE_MINUS_SRC_ALPHA);
  WriteLn('render_test: init() called');
end;

procedure frame(); export;
var
  r, g, b: Single;
begin
  // Cycle colors slowly to show the render loop is working
  r := 0.15 + 0.1 * Sin(FrameCount * 0.01);
  g := 0.05 + 0.1 * Sin(FrameCount * 0.013 + 1.0);
  b := 0.2  + 0.1 * Sin(FrameCount * 0.017 + 2.0);
  glClearColor(r, g, b, 1.0);
  glViewport(0, 0, 800, 600);
  glClear(GL_COLOR_BUFFER_BIT);
  Inc(FrameCount);
end;

exports init, frame;

begin
end.
