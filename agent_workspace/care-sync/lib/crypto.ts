/**
 * Care-Sync Vault Cryptographic Utilities
 * Implements Zero-Knowledge Client-Side Encryption
 */

const ITERATIONS = 600000; // High iteration count for PBKDF2
const ALGO = 'AES-GCM';

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function deriveKey(password: string, salt: Uint8Array<ArrayBuffer>): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: ITERATIONS,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: ALGO, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptFile(file: File, password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(password, salt);

  const fileBuffer = await file.arrayBuffer();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGO, iv },
    key,
    fileBuffer
  );

  // Generate SHA-256 Checksum of the encrypted blob for integrity
  const hashBuffer = await crypto.subtle.digest('SHA-256', encryptedBuffer);
  const checksum = Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return {
    encryptedBlob: new Blob([encryptedBuffer], { type: 'application/octet-stream' }),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
    checksum
  };
}

export async function decryptFile(
  encryptedBuffer: ArrayBuffer,
  password: string,
  ivBase64: string,
  saltBase64: string
): Promise<ArrayBuffer> {
  const iv = new Uint8Array(base64ToArrayBuffer(ivBase64));
  const salt = new Uint8Array(base64ToArrayBuffer(saltBase64));
  const key = await deriveKey(password, salt);

  return crypto.subtle.decrypt(
    { name: ALGO, iv },
    key,
    encryptedBuffer
  );
}
