import assert from 'assert';
import { createServer } from 'vite';
import { createMockChrome } from '../helpers/mock_chrome.js';

export async function runCryptoTests() {
  console.log('\n--- Unit Test Suite: Zero-Trust Cryptographic Vault (src/shared/crypto.ts) ---');

  // Install mock chrome in global environment
  const mockChrome = createMockChrome();
  globalThis.chrome = mockChrome;

  // Use Vite SSR loader to import TypeScript crypto module
  const server = await createServer({
    configFile: false,
    server: { middlewareMode: true },
    appType: 'custom',
    optimizeDeps: { noDiscovery: true },
  });

  const {
    getOrCreateVaultKey,
    encryptSecret,
    decryptSecret,
    maskSecret,
  } = await server.ssrLoadModule('./src/shared/crypto.ts');

  let passed = 0;
  function it(desc, fn) {
    try {
      fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}`);
      throw err;
    }
  }

  async function itAsync(desc, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${desc}`);
      throw err;
    }
  }

  // Test 1: Key Generation & Storage Persistence
  await itAsync('Generates and persists 256-bit AES-GCM key in chrome.storage.local', async () => {
    const key = await getOrCreateVaultKey();
    assert(key instanceof CryptoKey, 'Must return a CryptoKey instance');
    assert.strictEqual(key.algorithm.name, 'AES-GCM', 'Must use AES-GCM algorithm');

    // Verify key was saved to mock chrome.storage.local
    const stored = await mockChrome.storage.local.get('automacro_vault_aes_key');
    assert(stored.automacro_vault_aes_key, 'Key must be persisted to chrome.storage.local');
    assert.strictEqual(stored.automacro_vault_aes_key.kty, 'oct', 'JWK key type must be oct');
    assert.strictEqual(stored.automacro_vault_aes_key.alg, 'A256GCM', 'JWK algorithm must be A256GCM');
  });

  // Test 2: In-Memory Key Caching
  await itAsync('Reuses cached CryptoKey without redundant storage lookups', async () => {
    const key1 = await getOrCreateVaultKey();
    const key2 = await getOrCreateVaultKey();
    assert.strictEqual(key1, key2, 'Key references must be identical (in-memory caching)');
  });

  // Test 3: Standard Encryption & Decryption
  await itAsync('Encrypts standard credentials and decrypts back to exact plaintext', async () => {
    const secret = 'SuperSecretP@ssw0rd!#$2026';
    const encrypted = await encryptSecret(secret);

    assert(encrypted.ciphertext, 'Ciphertext must be present');
    assert(encrypted.iv, 'IV must be present');
    assert.notStrictEqual(encrypted.ciphertext, secret, 'Ciphertext must not be plaintext');

    // 96-bit IV encoded in base64 should have length 16 (12 bytes * 4/3 = 16)
    assert.strictEqual(encrypted.iv.length, 16, '96-bit IV base64 length must be 16 chars');

    const decrypted = await decryptSecret(encrypted.ciphertext, encrypted.iv);
    assert.strictEqual(decrypted, secret, 'Decrypted value must match original plaintext');
  });

  // Test 4: Edge Case - Unicode, Emojis, and Special Characters
  await itAsync('Edge Case: Accurately encrypts & decrypts Unicode, emojis, and symbols', async () => {
    const complexSecret = '🔒️_P@ssw🔑rd_日本語_مرحبا_12345!@#$%^&*()_+~`|}{[]:;?><,./';
    const encrypted = await encryptSecret(complexSecret);
    const decrypted = await decryptSecret(encrypted.ciphertext, encrypted.iv);
    assert.strictEqual(decrypted, complexSecret, 'Complex unicode must survive encryption roundtrip');
  });

  // Test 5: Edge Case - Large Payload (10,000+ characters)
  await itAsync('Edge Case: Handles large secrets (10,000+ chars) without buffer overflow', async () => {
    const longSecret = 'A'.repeat(12000) + 'END_SECRET_TOKEN';
    const encrypted = await encryptSecret(longSecret);
    const decrypted = await decryptSecret(encrypted.ciphertext, encrypted.iv);
    assert.strictEqual(decrypted, longSecret, '12KB payload must decrypt accurately');
  });

  // Test 6: Error Handling - Corrupted Ciphertext
  await itAsync('Error Handling: Corrupted ciphertext throws cryptographic operation error', async () => {
    const valid = await encryptSecret('ValidSecret123');
    const corruptedCiphertext = valid.ciphertext.slice(0, -4) + 'AAAA';

    await assert.rejects(
      async () => {
        await decryptSecret(corruptedCiphertext, valid.iv);
      },
      /operation failed|OperationError|bad decrypt/i,
      'Tampered ciphertext must be rejected by AES-GCM authentication tag check'
    );
  });

  // Test 7: Error Handling - Corrupted IV
  await itAsync('Error Handling: Corrupted IV fails authentication tag validation', async () => {
    const valid = await encryptSecret('ValidSecret123');
    // Modify one byte of IV
    const corruptedIv = 'B' + valid.iv.slice(1);

    await assert.rejects(
      async () => {
        await decryptSecret(valid.ciphertext, corruptedIv);
      },
      /operation failed|OperationError|bad decrypt/i,
      'Altered IV must be rejected by AES-GCM authentication check'
    );
  });

  // Test 8: Visual Masking
  it('maskSecret returns fixed bullet masking regardless of password length', () => {
    assert.strictEqual(maskSecret('short'), '••••••••');
    assert.strictEqual(maskSecret('super_long_secret_123456789'), '••••••••');
    assert.strictEqual(maskSecret(''), '••••••••');
  });

  await server.close();
  console.log(`  🌟 Passed ${passed} crypto vault unit tests.\n`);
  return passed;
}
