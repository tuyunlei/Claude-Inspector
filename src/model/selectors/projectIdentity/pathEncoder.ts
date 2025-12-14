
/**
 * Encodes a raw project path to match Claude's directory naming convention.
 * Replaces '/' and '_' with '-'. Ensures result starts with '-'.
 */
export function encodeProjectPath(rawPath: string): string {
  // Replace / and _ with -
  let result = rawPath.replace(/[\/_]/g, '-');
  
  // Ensure it starts with '-' (assuming absolute paths)
  if (!result.startsWith('-')) {
    result = '-' + result;
  }
  return result;
}

/**
 * Best-effort decoding for unknown projects.
 * Since multiple chars map to '-', this is lossy.
 */
export function decodeProjectPathGuess(encoded: string): string {
  // Remove leading '-'
  const trimmed = encoded.startsWith('-') ? encoded.slice(1) : encoded;
  const segments = trimmed.split('-').filter(Boolean);
  // Assume unix-style absolute path
  return '/' + segments.join('/');
}
