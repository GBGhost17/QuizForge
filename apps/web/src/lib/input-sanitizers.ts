/**
 * Utility functions to sanitize user input in authentication forms
 * Ensuring only English/ASCII characters are accepted to prevent IME (Telex/VNI) errors.
 */

/**
 * Normalizes Vietnamese diacritics and accented characters to standard ASCII Latin characters.
 * Example: 'Nguyễn Văn Đạt' -> 'Nguyen Van Dat'
 */
export function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D');
}

/**
 * Sanitizes email input:
 * 1. Converts Vietnamese accented characters to plain Latin (e.g. đ -> d)
 * 2. Only permits English alphanumeric characters, @, ., _, +, -
 * 3. Disallows spaces and non-ASCII characters
 */
export function sanitizeEnglishEmail(value: string): string {
  const normalized = removeVietnameseTones(value);
  return normalized.replace(/[^a-zA-Z0-9@._+-]/g, '');
}

/**
 * Sanitizes password input:
 * Disallows non-ASCII characters (including Vietnamese diacritics)
 * Only allows standard printable ASCII characters (33 to 126)
 */
export function sanitizeEnglishPassword(value: string): string {
  // Normalize tones first so accidental Telex marks are unaccented
  const normalized = removeVietnameseTones(value);
  // Permit printable ASCII characters without space or control characters
  return normalized.replace(/[^\x21-\x7E]/g, '');
}

/**
 * Sanitizes name input in registration:
 * Converts Vietnamese accented characters to English Latin alphabet
 * Only permits letters, spaces, dots, hyphens, apostrophes
 */
export function sanitizeEnglishName(value: string): string {
  const normalized = removeVietnameseTones(value);
  return normalized.replace(/[^a-zA-Z\s.'-]/g, '');
}

/**
 * Sanitizes generic English-only input (such as verification tokens or join codes):
 * Converts accented characters and only retains alphanumeric and hyphens
 */
export function sanitizeEnglishAlphanumeric(value: string): string {
  const normalized = removeVietnameseTones(value);
  return normalized.replace(/[^a-zA-Z0-9_-]/g, '');
}
