// @ts-nocheck
const base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function uint8ArrayToBase64(arr) {
  // Validate input is Uint8Array
  const tag = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(Uint8Array.prototype),
    Symbol.toStringTag,
  ).get;

  let kind;
  try {
    kind = tag.call(arr);
  } catch {
    throw new TypeError('not a Uint8Array');
  }
  if (kind !== 'Uint8Array') {
    throw new TypeError('not a Uint8Array');
  }

  // Check for detached buffer
  if ('detached' in arr.buffer && arr.buffer.detached) {
    throw new TypeError('toBase64 called on array backed by detached buffer');
  }

  let result = '';

  // Process full triplets
  let i = 0;
  for (; i + 2 < arr.length; i += 3) {
    const triplet = (arr[i] << 16) + (arr[i + 1] << 8) + arr[i + 2];
    result +=
      base64Characters[(triplet >> 18) & 63] +
      base64Characters[(triplet >> 12) & 63] +
      base64Characters[(triplet >> 6) & 63] +
      base64Characters[triplet & 63];
  }

  // Handle remaining bytes
  if (i + 2 === arr.length) {
    // Two bytes remaining
    const triplet = (arr[i] << 16) + (arr[i + 1] << 8);
    result +=
      base64Characters[(triplet >> 18) & 63] +
      base64Characters[(triplet >> 12) & 63] +
      base64Characters[(triplet >> 6) & 63] +
      '=';
  } else if (i + 1 === arr.length) {
    // One byte remaining
    const triplet = arr[i] << 16;
    result +=
      base64Characters[(triplet >> 18) & 63] + base64Characters[(triplet >> 12) & 63] + '==';
  }

  return result;
}

// Install the polyfill
Uint8Array.prototype.toBase64 = {
  toBase64() {
    return uint8ArrayToBase64(this);
  },
}.toBase64;

Object.defineProperty(Uint8Array.prototype, 'toBase64', { enumerable: false });
Object.defineProperty(Uint8Array.prototype.toBase64, 'length', { value: 0 });
