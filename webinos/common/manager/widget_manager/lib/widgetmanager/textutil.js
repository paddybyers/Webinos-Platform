this.TextUtil = (function() {
  
  /* public constructor */
  function TextUtil(args) {}

  /*
   * Determine if a given character is a space character
   * based on http://www.w3.org/TR/widgets/#character-definitions
   */
  TextUtil.isSpaceChar = function(c) {
    switch(c) {
    case ' ':      // SPACE
    case '\t':     // CHARACTER TABULATION (tab)
    case '\n':     // LINE FEED (LF)
    case '\u000B': // LINE TABULATION
    case '\f':     // FORM FEED (FF)
    case '\r':     // CARRIAGE RETURN (CR)
      return true;
    default:
      return false;
    }
  };

  /*
   * Determine if a given character is a unicode white space character
   * based on http://www.w3.org/TR/widgets/#character-definitions
   */
  TextUtil.isWhitespace = function(c) {
    if(c <= '\u0080')
      return TextUtil.isSpaceChar(c);

    switch(c) {
    case '\u0085':  // NEL (control character next line)
    case '\u00A0':  // NBSP (NO-BREAK SPACE)
    case '\u1680':  // OGHAM SPACE MARK
    case '\u180E':  // MONGOLIAN VOWEL SEPARATOR
    case '\u2028':  // LS (LINE SEPARATOR)
    case '\u2029':  // PS (PARAGRAPH SEPARATOR)
    case '\u202F':  // NNBSP (NARROW NO-BREAK SPACE)
    case '\u205F':  // MMSP (MEDIUM MATHEMATICAL SPACE)
    case '\u3000':  // IDEOGRAPHIC SPACE
      return true;
    default:
      return (c >= '\u2000' && c <= '\u200A'); // (different sorts of spaces)
    }
  };

  return TextUtil;
})();
