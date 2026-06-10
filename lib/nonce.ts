import * as Crypto from 'expo-crypto';

const BASE64URL_ALPHABET =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

function bytesToBase64Url(bytes: Uint8Array): string {
    let out = '';
    for (let i = 0; i < bytes.length; i += 3) {
        const b0 = bytes[i];
        const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
        const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
        out += BASE64URL_ALPHABET[b0 >> 2];
        out += BASE64URL_ALPHABET[((b0 & 0x03) << 4) | (b1 >> 4)];
        if (i + 1 < bytes.length) {
            out += BASE64URL_ALPHABET[((b1 & 0x0f) << 2) | (b2 >> 6)];
        }
        if (i + 2 < bytes.length) {
            out += BASE64URL_ALPHABET[b2 & 0x3f];
        }
    }
    return out;
}

export async function randomNonce(byteLength = 32): Promise<string> {
    const bytes = await Crypto.getRandomBytesAsync(byteLength);
    return bytesToBase64Url(bytes);
}

export async function sha256Hex(input: string): Promise<string> {
    return Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        input,
        { encoding: Crypto.CryptoEncoding.HEX }
    );
}
