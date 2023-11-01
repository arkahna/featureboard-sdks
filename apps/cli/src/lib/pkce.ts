import { createHash, randomBytes } from 'crypto'

function base64UrlEncode(str: Buffer): string {
    return str
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '')
}

export function generateCodeVerifier(): string {
    return base64UrlEncode(randomBytes(32))
}

export function generateCodeChallenge(verifier: string): string {
    return base64UrlEncode(createHash('sha256').update(verifier).digest())
}
