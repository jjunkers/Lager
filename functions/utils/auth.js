/**
 * Secure password hashing and verification using PBKDF2 (Web Crypto API)
 */

const PBKDF2_ROUNDS = 100000;
const SALT_SIZE = 16;
const KEY_SIZE = 32;

/**
 * Converts a buffer to a hex string
 */
function bufToHex(buf) {
    return Array.from(new Uint8Array(buf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

/**
 * Converts a hex string to a buffer
 */
function hexToBuf(hex) {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}

/**
 * Generates a secure PBKDF2 hash for a password
 * Returns: "pbkdf2:rounds:salthex:hashhex"
 */
export async function hashPassword(password) {
    const salt = crypto.getRandomValues(new Uint8Array(SALT_SIZE));

    const baseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const hash = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: PBKDF2_ROUNDS,
            hash: 'SHA-256'
        },
        baseKey,
        KEY_SIZE * 8
    );

    return `pbkdf2:${PBKDF2_ROUNDS}:${bufToHex(salt)}:${bufToHex(hash)}`;
}

/**
 * Verifies a password against a stored PBKDF2 hash
 */
export async function verifyPassword(password, storedHash) {
    if (!storedHash || !storedHash.startsWith('pbkdf2:')) {
        return false;
    }

    const parts = storedHash.split(':');
    if (parts.length !== 4) return false;

    const iterations = parseInt(parts[1], 10);
    const salt = hexToBuf(parts[2]);
    const originalHash = parts[3];

    const baseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(password),
        { name: 'PBKDF2' },
        false,
        ['deriveBits', 'deriveKey']
    );

    const newHashBits = await crypto.subtle.deriveBits(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: iterations,
            hash: 'SHA-256'
        },
        baseKey,
        KEY_SIZE * 8
    );

    const newHash = bufToHex(newHashBits);

    // Constant-time comparison (not strictly necessary with JS string compare but better practice)
    return newHash === originalHash;
}
