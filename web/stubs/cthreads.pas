{  cthreads stub for WASM — redirects to nothreads for safe no-op
   critical section and thread manager implementations  }
unit cthreads;
{$MODE DELPHI}
interface
implementation
uses nothreads;  // provides NoThreadManager with safe no-op EnterCriticalSection etc.
end.
