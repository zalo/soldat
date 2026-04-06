{*******************************************************}
{  dglOpenGL Web Stub Unit for OpenSoldat              }
{  Declares GL functions as static WASM imports from   }
{  the 'env' module. JS bridge provides implementations.}
{*******************************************************}

unit dglOpenGL;

{$MODE DELPHI}

interface

// ============================================================
// OpenGL Types
// ============================================================

type
  GLenum     = LongWord;
  GLboolean  = Boolean;
  GLbitfield = LongWord;
  GLint      = LongInt;
  GLuint     = LongWord;
  GLsizei    = LongInt;
  GLfloat    = Single;
  GLclampf   = Single;
  GLdouble   = Double;
  GLintptr   = PtrInt;
  GLsizeiptr = PtrInt;

  PGLuint    = ^GLuint;
  PGLint     = ^GLint;
  PGLsizei   = ^GLsizei;
  PGLfloat   = ^GLfloat;
  PGLchar    = PAnsiChar;
  PPGLchar   = ^PGLchar;
  PGLvoid    = Pointer;

  GLhandle   = GLuint;

// ============================================================
// OpenGL Constants
// ============================================================

const
  GL_FALSE = 0;
  GL_TRUE  = 1;

  GL_ZERO = 0;
  GL_ONE  = 1;

  GL_TRIANGLES       = $0004;
  GL_TRIANGLE_STRIP  = $0005;
  GL_TRIANGLE_FAN    = $0006;

  GL_UNSIGNED_BYTE   = $1401;
  GL_UNSIGNED_SHORT  = $1403;
  GL_FLOAT           = $1406;

  GL_BLEND           = $0BE2;
  GL_DEPTH_TEST      = $0B71;
  GL_MULTISAMPLE     = $809D;
  GL_TEXTURE_2D      = $0DE1;
  GL_SCISSOR_TEST    = $0C11;

  GL_ONE_MINUS_SRC_ALPHA = $0303;
  GL_SRC_ALPHA           = $0302;

  GL_COLOR_BUFFER_BIT   = $00004000;
  GL_DEPTH_BUFFER_BIT   = $00000100;
  GL_STENCIL_BUFFER_BIT = $00000400;

  GL_UNPACK_ALIGNMENT = $0CF5;
  GL_PACK_ALIGNMENT   = $0D05;
  GL_MAX_TEXTURE_SIZE = $0D33;
  GL_SAMPLES          = $80A9;

  GL_ARRAY_BUFFER         = $8892;
  GL_ELEMENT_ARRAY_BUFFER = $8893;
  GL_STREAM_DRAW          = $88E0;
  GL_STATIC_DRAW          = $88E4;
  GL_DYNAMIC_DRAW         = $88E8;

  GL_TEXTURE_MIN_FILTER = $2801;
  GL_TEXTURE_MAG_FILTER = $2800;
  GL_TEXTURE_WRAP_S     = $2802;
  GL_TEXTURE_WRAP_T     = $2803;

  GL_NEAREST             = $2600;
  GL_LINEAR              = $2601;
  GL_LINEAR_MIPMAP_LINEAR = $2703;
  GL_NEAREST_MIPMAP_NEAREST = $2700;
  GL_CLAMP_TO_EDGE       = $812F;
  GL_REPEAT              = $2901;

  GL_RGBA            = $1908;
  GL_RGB             = $1907;
  GL_ALPHA           = $1906;
  GL_RED             = $1903;
  GL_R8              = $8229;
  GL_LUMINANCE       = $1909;

  GL_TEXTURE0        = $84C0;
  GL_TEXTURE1        = $84C1;

  GL_FRAMEBUFFER                = $8D40;
  GL_READ_FRAMEBUFFER           = $8CA8;
  GL_DRAW_FRAMEBUFFER           = $8CA9;
  GL_COLOR_ATTACHMENT0          = $8CE0;
  GL_DEPTH_ATTACHMENT           = $8D00;
  GL_RENDERBUFFER               = $8D41;

  GL_VERTEX_SHADER   = $8B31;
  GL_FRAGMENT_SHADER = $8B30;
  GL_COMPILE_STATUS  = $8B81;
  GL_LINK_STATUS     = $8B82;
  GL_INFO_LOG_LENGTH = $8B84;
  GL_ACTIVE_UNIFORMS = $8B86;

  GL_VERSION = $1F02;
  GL_RENDERER = $1F01;
  GL_VENDOR   = $1F00;

  GL_GENERATE_MIPMAP_HINT = $8192;
  GL_NICEST               = $1102;

  GL_TEXTURE_FILTER_CONTROL = $8500;
  GL_TEXTURE_LOD_BIAS       = $8501;

  // Fixed pipeline constants (no-ops on web but needed for compilation)
  GL_VERTEX_ARRAY        = $8074;
  GL_TEXTURE_COORD_ARRAY = $8078;
  GL_COLOR_ARRAY         = $8076;

  GL_DITHER = $0BD0;

  GL_TEXTURE_2D_MULTISAMPLE = $9100;

  GL_LUMINANCE_ALPHA = $190A;
  GL_GENERATE_MIPMAP = $8191;

  GL_TEXTURE_COMPARE_MODE = $884C;
  GL_TEXTURE_COMPARE_FUNC = $884D;
  GL_COMPARE_REF_TO_TEXTURE = $884E;

// ============================================================
// GL Functions — WASM imports from 'env'
// ============================================================

// State
procedure glEnable(cap: GLenum); cdecl; external 'env';
procedure glDisable(cap: GLenum); cdecl; external 'env';
procedure glBlendFunc(sfactor, dfactor: GLenum); cdecl; external 'env';
procedure glClearColor(red, green, blue, alpha: GLclampf); cdecl; external 'env';
procedure glClear(mask: GLbitfield); cdecl; external 'env';
procedure glViewport(x, y: GLint; width, height: GLsizei); cdecl; external 'env';
procedure glScissor(x, y: GLint; width, height: GLsizei); cdecl; external 'env';
procedure glPixelStorei(pname: GLenum; param: GLint); cdecl; external 'env';
procedure glGetIntegerv(pname: GLenum; params: PGLint); cdecl; external 'env';
function glGetError(): GLenum; cdecl; external 'env';
function  glGetString(name: GLenum): PGLchar; cdecl; external 'env';
procedure glFinish(); cdecl; external 'env';
procedure glHint(target, mode: GLenum); cdecl; external 'env';

// Textures
procedure glGenTextures(n: GLsizei; textures: PGLuint); cdecl; external 'env';
procedure glDeleteTextures(n: GLsizei; textures: PGLuint); cdecl; external 'env';
procedure glBindTexture(target: GLenum; texture: GLuint); cdecl; external 'env';
procedure glTexImage2D(target: GLenum; level: GLint; internalformat: GLint; width, height: GLsizei; border: GLint; format, atype: GLenum; pixels: Pointer); cdecl; external 'env';
procedure glTexSubImage2D(target: GLenum; level: GLint; xoffset, yoffset: GLint; width, height: GLsizei; format, atype: GLenum; pixels: Pointer); cdecl; external 'env';
procedure glTexParameteri(target, pname: GLenum; param: GLint); cdecl; external 'env';
procedure glActiveTexture(texture: GLenum); cdecl; external 'env';
procedure glGenerateMipmap(target: GLenum); cdecl; external 'env';
procedure glReadPixels(x, y: GLint; width, height: GLsizei; format, atype: GLenum; pixels: Pointer); cdecl; external 'env';
procedure glTexImage2DMultisample(target: GLenum; samples: GLsizei; internalformat: GLenum; width, height: GLsizei; fixedsamplelocations: GLboolean); cdecl; external 'env';

// Buffers
procedure glGenBuffers(n: GLsizei; buffers: PGLuint); cdecl; external 'env';
procedure glDeleteBuffers(n: GLsizei; buffers: PGLuint); cdecl; external 'env';
procedure glBindBuffer(target: GLenum; buffer: GLuint); cdecl; external 'env';
procedure glBufferData(target: GLenum; size: GLsizeiptr; data: Pointer; usage: GLenum); cdecl; external 'env';
procedure glBufferSubData(target: GLenum; offset: GLintptr; size: GLsizeiptr; data: Pointer); cdecl; external 'env';

// Shaders
function  glCreateShader(shaderType: GLenum): GLuint; cdecl; external 'env';
procedure glDeleteShader(shader: GLuint); cdecl; external 'env';
procedure glShaderSource(shader: GLuint; count: GLsizei; src: PPGLChar; lengths: PGLint); cdecl; external 'env';
procedure glCompileShader(shader: GLuint); cdecl; external 'env';
procedure glGetShaderiv(shader: GLuint; pname: GLenum; params: PGLint); cdecl; external 'env';
procedure glGetShaderInfoLog(shader: GLuint; maxLen: GLsizei; len: PGLsizei; infoLog: PGLchar); cdecl; external 'env';

// Programs
function  glCreateProgram(): GLuint; cdecl; external 'env';
procedure glDeleteProgram(prog: GLuint); cdecl; external 'env';
procedure glAttachShader(prog, shader: GLuint); cdecl; external 'env';
procedure glDetachShader(prog, shader: GLuint); cdecl; external 'env';
procedure glLinkProgram(prog: GLuint); cdecl; external 'env';
procedure glUseProgram(prog: GLuint); cdecl; external 'env';
procedure glGetProgramiv(prog: GLuint; pname: GLenum; params: PGLint); cdecl; external 'env';
procedure glGetProgramInfoLog(prog: GLuint; maxLen: GLsizei; len: PGLsizei; infoLog: PGLchar); cdecl; external 'env';
procedure glBindAttribLocation(prog: GLuint; index: GLuint; name: PGLchar); cdecl; external 'env';
function  glGetUniformLocation(prog: GLuint; name: PGLchar): GLint; cdecl; external 'env';

// Uniforms
procedure glUniform1i(location: GLint; v0: GLint); cdecl; external 'env';
procedure glUniform1f(location: GLint; v0: GLfloat); cdecl; external 'env';
procedure glUniform2f(location: GLint; v0, v1: GLfloat); cdecl; external 'env';
procedure glUniform3f(location: GLint; v0, v1, v2: GLfloat); cdecl; external 'env';
procedure glUniform4f(location: GLint; v0, v1, v2, v3: GLfloat); cdecl; external 'env';
procedure glUniformMatrix3fv(location: GLint; count: GLsizei; transpose: GLboolean; value: PGLfloat); cdecl; external 'env';

// Vertex attributes
procedure glEnableVertexAttribArray(index: GLuint); cdecl; external 'env';
procedure glDisableVertexAttribArray(index: GLuint); cdecl; external 'env';
procedure glVertexAttribPointer(index: GLuint; size: GLint; atype: GLenum; normalized: GLboolean; stride: GLsizei; offset: Pointer); cdecl; external 'env';

// Drawing
procedure glDrawArrays(mode: GLenum; first: GLint; count: GLsizei); cdecl; external 'env';
procedure glDrawElements(mode: GLenum; count: GLsizei; atype: GLenum; indices: Pointer); cdecl; external 'env';

// Framebuffers
procedure glGenFramebuffers(n: GLsizei; framebuffers: PGLuint); cdecl; external 'env';
procedure glDeleteFramebuffers(n: GLsizei; framebuffers: PGLuint); cdecl; external 'env';
procedure glBindFramebuffer(target: GLenum; framebuffer: GLuint); cdecl; external 'env';
procedure glFramebufferTexture2D(target, attachment, textarget: GLenum; texture: GLuint; level: GLint); cdecl; external 'env';
procedure glBlitFramebuffer(sx0, sy0, sx1, sy1, dx0, dy0, dx1, dy1: GLint; mask: GLbitfield; filter: GLenum); cdecl; external 'env';
procedure glGenRenderbuffers(n: GLsizei; renderbuffers: PGLuint); cdecl; external 'env';
procedure glBindRenderbuffer(target: GLenum; renderbuffer: GLuint); cdecl; external 'env';
procedure glRenderbufferStorageMultisample(target: GLenum; samples: GLsizei; internalformat: GLenum; width, height: GLsizei); cdecl; external 'env';
procedure glFramebufferRenderbuffer(target, attachment, renderbuffertarget: GLenum; renderbuffer: GLuint); cdecl; external 'env';

// EXT aliases (same as core in WebGL2)
var
  glGenFramebuffersEXT: procedure(n: GLsizei; framebuffers: PGLuint); cdecl;
  glDeleteFramebuffersEXT: procedure(n: GLsizei; framebuffers: PGLuint); cdecl;
  glBindFramebufferEXT: procedure(target: GLenum; framebuffer: GLuint); cdecl;
  glFramebufferTexture2DEXT: procedure(target, attachment, textarget: GLenum; texture: GLuint; level: GLint); cdecl;
  glGenerateMipmapEXT: procedure(target: GLenum); cdecl;

// Fixed pipeline stubs (no-ops, referenced but not used on WebGL2)
procedure glTexEnvf(target, pname: GLenum; param: GLfloat); cdecl; external 'env';
procedure glEnableClientState(aarray: GLenum); cdecl; external 'env';
procedure glDisableClientState(aarray: GLenum); cdecl; external 'env';
procedure glVertexPointer(size: GLint; atype: GLenum; stride: GLsizei; data: Pointer); cdecl; external 'env';
procedure glTexCoordPointer(size: GLint; atype: GLenum; stride: GLsizei; data: Pointer); cdecl; external 'env';
procedure glColorPointer(size: GLint; atype: GLenum; stride: GLsizei; data: Pointer); cdecl; external 'env';
procedure glLoadMatrixf(m: PGLfloat); cdecl; external 'env';
procedure glMatrixMode(mode: GLenum); cdecl; external 'env';

// Initialization stubs
procedure InitOpenGL;
procedure ReadExtensions;
procedure ReadImplementationProperties;

implementation

procedure InitOpenGL; begin end;
procedure ReadExtensions; begin end;
procedure ReadImplementationProperties; begin end;

end.
