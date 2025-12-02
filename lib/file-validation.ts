/**
 * File validation utilities for secure file uploads
 */

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

// Allowed file types for avatars
const ALLOWED_AVATAR_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_AVATAR_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];

// File size limits (in bytes)
const MAX_AVATAR_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_NFT_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_NFT_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_NFT_MODEL_SIZE = 50 * 1024 * 1024; // 50MB

/**
 * Validate avatar file
 */
export function validateAvatarFile(
  fileUri: string,
  fileSize?: number,
  mimeType?: string
): FileValidationResult {
  // Check file extension
  const fileExt = fileUri.split('.').pop()?.toLowerCase();
  if (!fileExt || !ALLOWED_AVATAR_EXTENSIONS.includes(fileExt)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_AVATAR_EXTENSIONS.join(', ')}`,
    };
  }

  // Check MIME type if provided
  if (mimeType && !ALLOWED_AVATAR_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: 'Invalid file type. Only images are allowed.',
    };
  }

  // Check file size if provided
  if (fileSize && fileSize > MAX_AVATAR_SIZE) {
    return {
      valid: false,
      error: `File too large. Maximum size: ${MAX_AVATAR_SIZE / (1024 * 1024)}MB`,
    };
  }

  return { valid: true };
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
export function sanitizeFilename(filename: string): string {
  // Remove path separators and dangerous characters
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/^\./, '_')
    .substring(0, 255); // Limit length
}

/**
 * Generate safe filename for upload
 */
export function generateSafeFilename(
  userId: string,
  originalFilename: string,
  prefix?: string
): string {
  const sanitized = sanitizeFilename(originalFilename);
  const ext = sanitized.split('.').pop() || 'jpg';
  const timestamp = Date.now();
  const prefixPart = prefix ? `${prefix}-` : '';
  return `${prefixPart}${userId}-${timestamp}.${ext}`;
}

/**
 * Get file size from base64 string
 */
export function getBase64FileSize(base64: string): number {
  // Approximate size: base64 is ~33% larger than binary
  const base64Length = base64.length;
  const padding = base64.match(/=/g)?.length || 0;
  return Math.floor((base64Length * 3) / 4 - padding);
}

