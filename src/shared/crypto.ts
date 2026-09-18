/**
 * AutoMacro Zero-Trust Cryptographic Engine
 * AES-256-GCM client-side encryption using native Web Crypto API (crypto.subtle).
 */

const VAULT_KEY_STORAGE_KEY = 'automacro_vault_aes_key';
let cachedKey: CryptoKey | null = null;

/**
 * Retrieve or generate a client-side AES-256-GCM key stored in chrome.storage.local.
 */
export async function getOrCreateVaultKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey;

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const stored = await chrome.storage.local.get(VAULT_KEY_STORAGE_KEY);
      if (stored[VAULT_KEY_STORAGE_KEY]) {
        cachedKey = await crypto.subtle.importKey(
          'jwk',
          stored[VAULT_KEY_STORAGE_KEY],
          { name: 'AES-GCM' },
          true,
          ['encrypt', 'decrypt']
        );
        return cachedKey;
      }
    }
  } catch (e) {
    console.warn('AutoMacro Crypto: storage access notice, generating session key:', e);
  }

  // Generate a cryptographically secure 256-bit AES-GCM key
  cachedKey = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      const jwk = await crypto.subtle.exportKey('jwk', cachedKey);
      await chrome.storage.local.set({ [VAULT_KEY_STORAGE_KEY]: jwk });
    }
  } catch (e) {
    console.warn('AutoMacro Crypto: key export notice:', e);
  }

  return cachedKey;
}

/**
 * Encrypt a plain-text secret using AES-256-GCM with a random 96-bit initialization vector.
 */
export async function encryptSecret(
  plainText: string
): Promise<{ ciphertext: string; iv: string }> {
  const key = await getOrCreateVaultKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for GCM
  const encoded = new TextEncoder().encode(plainText);

  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded
  );

  return {
    ciphertext: bufferToBase64(new Uint8Array(encrypted)),
    iv: bufferToBase64(iv),
  };
}

/**
 * Decrypt an AES-256-GCM ciphertext using the vault key.
 */
export async function decryptSecret(
  ciphertext: string,
  iv: string
): Promise<string> {
  const key = await getOrCreateVaultKey();
  const ivBytes = base64ToBuffer(iv);
  const cipherBytes = base64ToBuffer(ciphertext);

  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivBytes.buffer as ArrayBuffer },
    key,
    cipherBytes.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(decrypted);
}

/**
 * Visual masking helper for credentials.
 */
export function maskSecret(_value?: string): string {
  return '••••••••';
}

function bufferToBase64(buf: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < buf.length; i++) {
    binary += String.fromCharCode(buf[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
