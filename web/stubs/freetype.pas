// Web FreeType stub — redirects font operations to JS Canvas 2D bridge
// The JS bridge rasterizes glyphs and writes results into WASM memory structures.

unit FreeType;
{$NOTES OFF}
{$MINENUMSIZE 4}

interface

const
  FTLIB = 'env';

// --- Types & Constants (identical to native FreeType bindings) ---

type
  {$if defined(cpu64) and not(defined(win64) and defined(cpux86_64))}
  FT_Long = int64;
  FT_ULong = qword;
  FT_Pos = int64;
  {$ELSE}
  FT_Long = longint;
  FT_ULong = longword;
  FT_Pos = longint;
  {$ENDIF}

  FT_UInt32_ptr = ^FT_UInt32;
  FT_Int16  = SmallInt;
  FT_UInt16 = Word;
  FT_Int32  = LongInt;
  FT_UInt32 = LongWord;

  FT_Bool    =  Byte;
  FT_FWord   =  SmallInt;
  FT_UFWord  =  Word;
  FT_Char    =  ShortInt;
  FT_Byte    =  Byte;
  FT_Bytes   = ^FT_Byte;
  FT_Tag     =  FT_UInt32;
  FT_String  =  AnsiChar;
  FT_Short   =  SmallInt;
  FT_UShort  =  Word;
  FT_Int     =  LongInt;
  FT_UInt    =  LongWord;
  FT_F2Dot14 =  SmallInt;
  FT_F26Dot6 =  FT_Long;
  FT_Fixed   =  FT_Long;
  FT_Error   =  LongInt;
  FT_Pointer =  Pointer;

  FT_String_ptr = ^FT_String;
  FT_Int_ptr    = ^FT_Int;
  FT_UInt_ptr   = ^FT_UInt;
  FT_Fixed_ptr  = ^FT_Fixed;
  FT_Matrix_ptr = ^FT_Matrix;

  FT_Vector_ptr = ^FT_Vector;

  FT_Memory = Pointer;
  FT_Stream = Pointer;

  FT_Vector = record
    x: FT_Pos;
    y: FT_Pos;
  end;

  FT_BBox = record
    xMin, yMin: FT_Pos;
    xMax, yMax: FT_Pos;
  end;

  FT_Matrix = record
    xx, xy: FT_Fixed;
    yx, yy: FT_Fixed;
  end;

  FT_Generic_Finalizer = procedure(obj: Pointer); cdecl;
  FT_Generic = record
    data:      Pointer;
    finalizer: FT_Generic_Finalizer;
  end;

  FT_ListNode = ^FT_ListNodeRec;
  FT_List     = ^FT_ListRec;
  FT_ListNodeRec = record
    prev: FT_ListNode;
    next: FT_ListNode;
    data: Pointer;
  end;
  FT_ListRec = record
    head: FT_ListNode;
    tail: FT_ListNode;
  end;

  FT_Pixel_Mode = (
    FT_PIXEL_MODE_NONE = 0,
    FT_PIXEL_MODE_MONO,
    FT_PIXEL_MODE_GRAY,
    FT_PIXEL_MODE_GRAY2,
    FT_PIXEL_MODE_GRAY4,
    FT_PIXEL_MODE_LCD,
    FT_PIXEL_MODE_LCD_V,
    FT_PIXEL_MODE_BGRA,
    FT_PIXEL_MODE_MAX
  );

  FT_Glyph_Format = (
    FT_GLYPH_FORMAT_NONE      = $00000000,
    FT_GLYPH_FORMAT_COMPOSITE = $636f6d70,
    FT_GLYPH_FORMAT_BITMAP    = $62697473,
    FT_GLYPH_FORMAT_OUTLINE   = $6f75746c,
    FT_GLYPH_FORMAT_PLOTTER   = $706c6f74
  );

  FT_Encoding = (
    FT_ENCODING_NONE           = $00000000,
    FT_ENCODING_MS_SYMBOL      = $73796d62,
    FT_ENCODING_UNICODE        = $756e6963,
    FT_ENCODING_SJIS           = $736a6973,
    FT_ENCODING_PRC            = $67622020,
    FT_ENCODING_BIG5           = $62696735,
    FT_ENCODING_WANSUNG        = $77616e73,
    FT_ENCODING_JOHAB          = $6a6f6861,
    FT_ENCODING_GB2312         = $67622020,
    FT_ENCODING_MS_SJIS        = $736a6973,
    FT_ENCODING_MS_GB2312      = $67622020,
    FT_ENCODING_MS_BIG5        = $62696735,
    FT_ENCODING_MS_WANSUNG     = $77616e73,
    FT_ENCODING_MS_JOHAB       = $6a6f6861,
    FT_ENCODING_ADOBE_STANDARD = $41444f42,
    FT_ENCODING_ADOBE_EXPERT   = $41444245,
    FT_ENCODING_ADOBE_CUSTOM   = $41444243,
    FT_ENCODING_ADOBE_LATIN_1  = $6c617431,
    FT_ENCODING_OLD_LATIN_2    = $6c617432,
    FT_ENCODING_APPLE_ROMAN    = $61726d6e
  );

  FT_Size_Request_Type = (
    FT_SIZE_REQUEST_TYPE_NOMINAL = 0,
    FT_SIZE_REQUEST_TYPE_REAL_DIM,
    FT_SIZE_REQUEST_TYPE_BBOX,
    FT_SIZE_REQUEST_TYPE_CELL,
    FT_SIZE_REQUEST_TYPE_SCALES,
    FT_SIZE_REQUEST_TYPE_MAX
  );

  FT_Render_Mode = (
    FT_RENDER_MODE_NORMAL = 0,
    FT_RENDER_MODE_LIGHT,
    FT_RENDER_MODE_MONO,
    FT_RENDER_MODE_LCD,
    FT_RENDER_MODE_LCD_V,
    FT_RENDER_MODE_SDF,
    FT_RENDER_MODE_MAX
  );

  FT_Kerning_Mode = (
    FT_KERNING_DEFAULT = 0,
    FT_KERNING_UNFITTED,
    FT_KERNING_UNSCALED
  );

const
  FT_Err_Ok                   = $00;
  FT_Err_Cannot_Open_Resource = $01;
  FT_Err_Unknown_File_Format  = $02;
  FT_Err_Invalid_Argument     = $06;

  FT_FACE_FLAG_SCALABLE      = 1 shl 0;
  FT_FACE_FLAG_HORIZONTAL    = 1 shl 4;
  FT_FACE_FLAG_KERNING       = 1 shl 6;

  FT_LOAD_DEFAULT            = 0;
  FT_LOAD_RENDER             = 1 shl 2;
  FT_LOAD_MONOCHROME         = 1 shl 12;
  FT_LOAD_NO_HINTING         = 1 shl 1;
  FT_LOAD_NO_AUTOHINT        = 1 shl 15;
  FT_LOAD_FORCE_AUTOHINT     = 1 shl 5;
  FT_LOAD_NO_BITMAP          = 1 shl 3;
  FT_LOAD_NO_RECURSE         = 1 shl 10;
  FT_LOAD_IGNORE_TRANSFORM   = 1 shl 11;
  FT_LOAD_LINEAR_DESIGN      = 1 shl 13;
  FT_LOAD_COLOR              = 1 shl 20;
  FT_LOAD_COMPUTE_METRICS    = 1 shl 21;
  FT_LOAD_BITMAP_METRICS_ONLY = 1 shl 22;
  FT_LOAD_ADVANCE_ONLY       = 1 shl 8;
  FT_LOAD_TARGET_NORMAL      = 0;
  FT_LOAD_TARGET_LIGHT       = (Integer(FT_RENDER_MODE_LIGHT) and 15) shl 16;
  FT_LOAD_TARGET_MONO        = (Integer(FT_RENDER_MODE_MONO) and 15) shl 16;

  FT_OUTLINE_NONE            = $0000;

type
  FT_Library_ptr   = ^FT_Library;
  FT_Face_ptr      = ^FT_Face;

  FT_Glyph_Metrics = record
    width:        FT_Pos;
    height:       FT_Pos;
    horiBearingX: FT_Pos;
    horiBearingY: FT_Pos;
    horiAdvance:  FT_Pos;
    vertBearingX: FT_Pos;
    vertBearingY: FT_Pos;
    vertAdvance:  FT_Pos;
  end;

  FT_Bitmap_Size = record
    height: FT_Short;
    width:  FT_Short;
    size:   FT_Pos;
    x_ppem: FT_Pos;
    y_ppem: FT_Pos;
  end;

  FT_Bitmap = record
    rows:         LongWord;
    width:        LongWord;
    pitch:        LongInt;
    buffer:       PByte;
    num_grays:    Word;
    pixel_mode:   Byte;
    palette_mode: Byte;
    palette:      Pointer;
  end;

  FT_Outline = record
    n_contours:  SmallInt;
    n_points:    SmallInt;
    points:      Pointer;
    tags:        Pointer;
    contours:    Pointer;
    flags:       LongInt;
  end;

  FT_Library   = ^FT_LibraryRec;
  FT_Module    = ^FT_ModuleRec;
  FT_Driver    = ^FT_DriverRec;
  FT_Face      = ^FT_FaceRec;
  FT_Size      = ^FT_SizeRec;
  FT_GlyphSlot = ^FT_GlyphSlotRec;
  FT_CharMap   = ^FT_CharMapRec;

  FT_LibraryRec  = record end;
  FT_ModuleRec   = record end;
  FT_DriverRec   = record end;

  FT_CharMapRec = record
    face:        FT_Face;
    encoding:    FT_Encoding;
    platform_id: FT_UShort;
    encoding_id: FT_UShort;
  end;

  FT_Face_Internal    = ^FT_Face_InternalRec;
  FT_Face_InternalRec =  record end;

  FT_FaceRec = record
    num_faces:            FT_Long;
    face_index:           FT_Long;
    face_flags:           FT_Long;
    style_flags:          FT_Long;
    num_glyphs:           FT_Long;
    family_name:         ^FT_String;
    style_name:          ^FT_String;
    num_fixed_sizes:      FT_Int;
    available_sizes:     ^FT_Bitmap_Size;
    num_charmaps:         FT_Int;
    charmaps:            ^FT_CharMap;
    generic:              FT_Generic;
    bbox:                 FT_BBox;
    units_per_EM:         FT_UShort;
    ascender:             FT_Short;
    descender:            FT_Short;
    height:               FT_Short;
    max_advance_width:    FT_Short;
    max_advance_height:   FT_Short;
    underline_position:   FT_Short;
    underline_thickness:  FT_Short;
    glyph:                FT_GlyphSlot;
    size:                 FT_Size;
    charmap:              FT_CharMap;
    driver:               FT_Driver;
    memory:               FT_Memory;
    stream:               FT_Stream;
    sizes_list:           FT_ListRec;
    autohint:             FT_Generic;
    extensions:           Pointer;
    internal:             FT_Face_Internal;
  end;

  FT_Size_Internal    = ^FT_Size_InternalRec;
  FT_Size_InternalRec =  record end;

  FT_Size_Metrics = record
    x_ppem:      FT_UShort;
    y_ppem:      FT_UShort;
    x_scale:     FT_Fixed;
    y_scale:     FT_Fixed;
    ascender:    FT_Pos;
    descender:   FT_Pos;
    height:      FT_Pos;
    max_advance: FT_Pos;
  end;

  FT_SizeRec = record
    face:     FT_Face;
    generic:  FT_Generic;
    metrics:  FT_Size_Metrics;
    internal: FT_Size_Internal;
  end;

  FT_SubGlyph    = Pointer;
  FT_Slot_Internal = Pointer;

  FT_GlyphSlotRec = record
    lib:               FT_Library;
    face:              FT_Face;
    next:              FT_GlyphSlot;
    glyph_index:       FT_UInt;
    generic:           FT_Generic;
    metrics:           FT_Glyph_Metrics;
    linearHoriAdvance: FT_Fixed;
    linearVertAdvance: FT_Fixed;
    advance:           FT_Vector;
    format:            FT_Glyph_Format;
    bitmap:            FT_Bitmap;
    bitmap_left:       FT_Int;
    bitmap_top:        FT_Int;
    outline:           FT_Outline;
    num_subglyphs:     FT_UInt;
    subglyphs:         FT_SubGlyph;
    control_data:      Pointer;
    control_len:       FT_Long;
    lsb_delta:         FT_Pos;
    rsb_delta:         FT_Pos;
    other:             Pointer;
    internal:          FT_Slot_Internal;
  end;

  FT_Size_Request = ^FT_Size_RequestRec;
  FT_Size_RequestRec = record
    typ:            FT_Size_Request_Type;
    width:          FT_Long;
    height:         FT_Long;
    horiResolution: FT_UInt;
    vertResolution: FT_UInt;
  end;

// --- Function declarations (routed to JS via 'env') ---

function  FT_Init_FreeType(alib: FT_Library_ptr): FT_Error; cdecl; external FTLIB;
function  FT_Done_FreeType(lib: FT_Library): FT_Error; cdecl; external FTLIB;
function  FT_New_Face(lib: FT_Library; filename: PAnsiChar; face_index: FT_Long; aface: FT_Face_ptr): FT_Error; cdecl; external FTLIB;
function  FT_New_Memory_Face(lib: FT_Library; file_base: FT_Bytes; file_size: FT_Long; face_index: FT_Long; aface: FT_Face_ptr): FT_Error; cdecl; external FTLIB;
function  FT_Done_Face(face: FT_Face): FT_Error; cdecl; external FTLIB;
function  FT_Request_Size(face: FT_Face; req: FT_Size_Request): FT_Error; cdecl; external FTLIB;
function  FT_Set_Char_Size(face: FT_Face; char_width: FT_F26Dot6; char_height: FT_F26Dot6; horz_resolution: FT_UInt; vert_resolution: FT_UInt): FT_Error; cdecl; external FTLIB;
function  FT_Set_Pixel_Sizes(face: FT_Face; pixel_width: FT_UInt; pixel_height: FT_UInt): FT_Error; cdecl; external FTLIB;
function  FT_Load_Glyph(face: FT_Face; glyph_index: FT_UInt; load_flags: FT_Int32): FT_Error; cdecl; external FTLIB;
function  FT_Get_Kerning(face: FT_Face; left_glyph: FT_UInt; right_glyph: FT_UInt; kern_mode: FT_UInt; akerning: FT_Vector_ptr): FT_Error; cdecl; external FTLIB;
function  FT_Select_Charmap(face: FT_Face; encoding: FT_Encoding): FT_Error; cdecl; external FTLIB;
function  FT_Get_Char_Index(face: FT_Face; charcode: FT_ULong): FT_UInt; cdecl; external FTLIB;

// Macro replacements
function FT_HAS_HORIZONTAL(face: FT_Face): Boolean;
function FT_HAS_KERNING(face: FT_Face): Boolean;
function FT_IS_SCALABLE(face: FT_Face): Boolean;

implementation

function FT_HAS_HORIZONTAL(face: FT_Face): Boolean;
begin
  Result := (face <> nil) and ((face^.face_flags and FT_FACE_FLAG_HORIZONTAL) <> 0);
end;

function FT_HAS_KERNING(face: FT_Face): Boolean;
begin
  Result := (face <> nil) and ((face^.face_flags and FT_FACE_FLAG_KERNING) <> 0);
end;

function FT_IS_SCALABLE(face: FT_Face): Boolean;
begin
  Result := (face <> nil) and ((face^.face_flags and FT_FACE_FLAG_SCALABLE) <> 0);
end;

end.
