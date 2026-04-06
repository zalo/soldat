{*******************************************************}
{  OpenAL Web Stub Unit for OpenSoldat                 }
{  Provides types, constants, and stub functions.      }
{  Actual audio handled by Web Audio bridge in JS.     }
{*******************************************************}

unit openal;

{$MODE DELPHI}

interface

type
  ALuint   = LongWord;
  ALint    = LongInt;
  ALfloat  = Single;
  ALenum   = LongInt;
  ALsizei  = LongInt;
  ALboolean = Byte;
  PALuint  = ^ALuint;
  PALint   = ^ALint;
  PALfloat = ^ALfloat;

  PALCdevice  = Pointer;
  PALCcontext = Pointer;

const
  AL_NONE    = 0;
  AL_FALSE   = 0;
  AL_TRUE    = 1;

  AL_NO_ERROR = 0;

  AL_BUFFER  = $1009;
  AL_GAIN    = $100A;
  AL_POSITION = $1004;
  AL_LOOPING = $1007;
  AL_SOURCE_STATE      = $1010;
  AL_BUFFERS_PROCESSED = $1016;

  AL_PLAYING = $1012;
  AL_PAUSED  = $1013;
  AL_STOPPED = $1014;

  AL_FORMAT_MONO8          = $1100;
  AL_FORMAT_MONO16         = $1101;
  AL_FORMAT_STEREO8        = $1102;
  AL_FORMAT_STEREO16       = $1103;
  AL_FORMAT_MONO_FLOAT32   = $10010;
  AL_FORMAT_STEREO_FLOAT32 = $10011;

// Stub functions
function  alcOpenDevice(devicename: PChar): PALCdevice;
function  alcCreateContext(device: PALCdevice; attrlist: Pointer): PALCcontext;
function  alcMakeContextCurrent(context: PALCcontext): ALboolean;
procedure alcDestroyContext(context: PALCcontext);
function  alcCloseDevice(device: PALCdevice): ALboolean;

procedure alDistanceModel(distanceModel: ALenum);
procedure alGenSources(n: ALsizei; sources: PALuint);
procedure alDeleteSources(n: ALsizei; sources: PALuint);
procedure alGenBuffers(n: ALsizei; buffers: PALuint);
procedure alDeleteBuffers(n: ALsizei; buffers: PALuint);
function  alGetError(): ALenum;
procedure alBufferData(buffer: ALuint; format: ALenum; data: Pointer; size, freq: ALsizei);
procedure alSourcei(source: ALuint; param: ALenum; value: ALint);
procedure alSourcef(source: ALuint; param: ALenum; value: ALfloat);
procedure alSource3f(source: ALuint; param: ALenum; v1, v2, v3: ALfloat);
procedure alGetSourcei(source: ALuint; param: ALenum; var value: ALint);
procedure alSourcePlay(source: ALuint);
procedure alSourceStop(source: ALuint);
procedure alSourcePause(source: ALuint);
procedure alSourceQueueBuffers(source: ALuint; nb: ALsizei; buffers: PALuint);
procedure alSourceUnqueueBuffers(source: ALuint; nb: ALsizei; buffers: PALuint);

implementation

function alcOpenDevice(devicename: PChar): PALCdevice;
begin Result := Pointer(1); end;

function alcCreateContext(device: PALCdevice; attrlist: Pointer): PALCcontext;
begin Result := Pointer(1); end;

function alcMakeContextCurrent(context: PALCcontext): ALboolean;
begin Result := AL_TRUE; end;

procedure alcDestroyContext(context: PALCcontext); begin end;

function alcCloseDevice(device: PALCdevice): ALboolean;
begin Result := AL_TRUE; end;

procedure alDistanceModel(distanceModel: ALenum); begin end;
procedure alGenSources(n: ALsizei; sources: PALuint); begin end;
procedure alDeleteSources(n: ALsizei; sources: PALuint); begin end;
procedure alGenBuffers(n: ALsizei; buffers: PALuint); begin end;
procedure alDeleteBuffers(n: ALsizei; buffers: PALuint); begin end;
function  alGetError(): ALenum; begin Result := AL_NO_ERROR; end;
procedure alBufferData(buffer: ALuint; format: ALenum; data: Pointer; size, freq: ALsizei); begin end;
procedure alSourcei(source: ALuint; param: ALenum; value: ALint); begin end;
procedure alSourcef(source: ALuint; param: ALenum; value: ALfloat); begin end;
procedure alSource3f(source: ALuint; param: ALenum; v1, v2, v3: ALfloat); begin end;
procedure alGetSourcei(source: ALuint; param: ALenum; var value: ALint);
begin value := 0; end;
procedure alSourcePlay(source: ALuint); begin end;
procedure alSourceStop(source: ALuint); begin end;
procedure alSourcePause(source: ALuint); begin end;
procedure alSourceQueueBuffers(source: ALuint; nb: ALsizei; buffers: PALuint); begin end;
procedure alSourceUnqueueBuffers(source: ALuint; nb: ALsizei; buffers: PALuint); begin end;

end.
