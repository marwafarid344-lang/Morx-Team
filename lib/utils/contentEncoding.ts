/**
 * Content Encoding Utility (Server-side)
 * Uses Base64 + XOR cipher to encode sensitive content before storing in database
 */

// Secret key for XOR cipher - should be set in environment variables
const SECRET_KEY = process.env.CONTENT_SECRET_KEY || 'M0RX-S3CR3T-K3Y-2026';

/**
 * XOR cipher function on Buffer
 */
function xorCipherBuffer(buffer: Buffer, key: string): Buffer {
  const result = Buffer.alloc(buffer.length);
  for (let i = 0; i < buffer.length; i++) {
    result[i] = buffer[i] ^ key.charCodeAt(i % key.length);
  }
  return result;
}

/**
 * Encode content for storage in database
 * @param text Plain text content
 * @returns Encoded string (Base64)
 */
export function encodeContent(text: string): string {
  if (!text || text.trim() === '') return text;
  
  try {
    // Convert text to buffer (UTF-8 by default)
    const buffer = Buffer.from(text, 'utf8');
    
    // XOR the bytes
    const xored = xorCipherBuffer(buffer, SECRET_KEY);
    
    // Convert to Base64
    const encoded = xored.toString('base64');
    
    // Add prefix to identify encoded content
    return `ENC:${encoded}`;
  } catch (error) {
    console.error('Encoding error:', error);
    return text; // Return original if encoding fails
  }
}

/**
 * Decode content from database
 * @param encoded Encoded string
 * @returns Original plain text
 */
export function decodeContent(encoded: string): string {
  if (!encoded || !encoded.startsWith('ENC:')) return encoded;
  
  try {
    // Remove prefix
    const base64 = encoded.substring(4);
    
    // Decode from Base64 to Buffer
    const buffer = Buffer.from(base64, 'base64');
    
    // XOR with secret key to get original bytes
    const originalBuffer = xorCipherBuffer(buffer, SECRET_KEY);
    
    // Convert back to string (UTF-8)
    return originalBuffer.toString('utf8');
  } catch (error) {
    console.error('Decoding error:', error);
    return encoded; // Return original if decoding fails
  }
}

/**
 * Check if content is encoded
 */
export function isEncoded(text: string): boolean {
  return text?.startsWith('ENC:') || false;
}
