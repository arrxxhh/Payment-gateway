import crypto from 'crypto';

function getKeyAndIv() {
  const keyHex = process.env.AES_KEY_HEX;
  const ivHex = process.env.AES_IV_HEX;
  if (!keyHex || !ivHex) {
    throw new Error('AES_KEY_HEX or AES_IV_HEX not set');
  }
  const key = Buffer.from(keyHex, 'hex');
  const iv = Buffer.from(ivHex, 'hex');
  if (key.length !== 32) throw new Error('AES key must be 32 bytes (64 hex chars)');
  if (iv.length !== 16) throw new Error('AES IV must be 16 bytes (32 hex chars)');
  return { key, iv };
}

export function encryptText(plainText) {
  const { key, iv } = getKeyAndIv();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(String(plainText), 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

export function decryptText(cipherTextBase64) {
  const { key, iv } = getKeyAndIv();
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(cipherTextBase64, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function hashTxnId(input) {
  return crypto.createHash('sha256').update(String(input)).digest('hex');
}


