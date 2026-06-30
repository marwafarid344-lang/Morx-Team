/**
 * Content Decoding Utility (Client-side)
 * Decodes content that was encoded by the server
 * Uses the same Base64 + XOR algorithm
 */

// Must match the server-side key
const SECRET_KEY = 'M0RX-S3CR3T-K3Y-2026';

/**
 * XOR cipher function on Byte Array
 */
function xorCipherBytes(bytes: Uint8Array, key: string): Uint8Array {
  const result = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[i] = bytes[i] ^ key.charCodeAt(i % key.length);
  }
  return result;
}

/**
 * Decode content from API response
 * @param encoded Encoded string from API
 * @returns Original plain text
 */
export function decodeContent(encoded: string | null | undefined): string {
  if (!encoded || !encoded.startsWith('ENC:')) return encoded || '';
  
  try {
    // Remove prefix
    const base64 = encoded.substring(4);
    
    // Decode from Base64 to Binary String
    const binaryString = atob(base64);
    
    // Convert Binary String to Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // XOR with secret key to get original bytes
    const originalBytes = xorCipherBytes(bytes, SECRET_KEY);
    
    // Decode bytes to UTF-8 String
    return new TextDecoder('utf-8').decode(originalBytes);
  } catch (error) {
    console.error('Decoding error:', error);
    return encoded || ''; // Return original if decoding fails
  }
}

/**
 * Check if content is encoded
 */
export function isEncoded(text: string | null | undefined): boolean {
  return text?.startsWith('ENC:') || false;
}

/**
 * Decode multiple fields in an object
 */
export function decodeFields<T extends Record<string, any>>(
  obj: T, 
  fields: (keyof T)[]
): T {
  if (!obj) return obj;
  
  const decoded = { ...obj };
  for (const field of fields) {
    if (typeof decoded[field] === 'string') {
      (decoded as any)[field] = decodeContent(decoded[field] as string);
    }
  }
  return decoded;
}

/**
 * Decode task object (title, description)
 */
export function decodeTask<T extends { title?: string; description?: string }>(task: T): T {
  if (!task) return task;
  return {
    ...task,
    title: decodeContent(task.title),
    description: decodeContent(task.description),
  };
}

/**
 * Decode comment object (comment_text)
 */
export function decodeComment<T extends { comment_text?: string }>(comment: T): T {
  if (!comment) return comment;
  return {
    ...comment,
    comment_text: decodeContent(comment.comment_text),
  };
}

/**
 * Decode task doc object (content)
 */
export function decodeTaskDoc<T extends { content?: string }>(doc: T): T {
  if (!doc) return doc;
  return {
    ...doc,
    content: decodeContent(doc.content),
  };
}
