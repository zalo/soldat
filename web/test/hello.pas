program hello;

{$mode delphi}

function add(a, b: LongInt): LongInt; export;
begin
  Result := a + b;
end;

exports add;

begin
end.
