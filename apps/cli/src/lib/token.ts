import fs from 'node:fs'
import path from 'node:path'
import querystring from 'node:querystring'
import { CLIENT_ID, TOKEN_FILE_PATH } from './config'

interface TokenData {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    expiration_time?: number // We'll store the exact expiration time for easier checks
}

// 3524 is alphanumeric for 'FLAG' (on a phone keypad)
export const REDIRECT_PORT = 3524
export const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`
export const AUTH_URL = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI,
)}/callback&scope=user.read offline_access`
export const TOKEN_URL =
    'https://login.microsoftonline.com/common/oauth2/v2.0/token'

const TOKEN_FILE = path.join(TOKEN_FILE_PATH, 'token.json')

export function writeToken(tokenData: any) {
    // Check if the directory exists, create it if not
    if (!fs.existsSync(TOKEN_FILE_PATH)) {
        fs.mkdirSync(TOKEN_FILE_PATH, { recursive: true })
    }

    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData))
}

export async function readToken(): Promise<TokenData | null> {
    try {
        const rawData = fs.readFileSync(TOKEN_FILE, 'utf-8')
        return JSON.parse(rawData) as TokenData
    } catch (error) {
        return null
    }
}

export async function performTokenRefresh(
    refreshToken: string,
): Promise<TokenData> {
    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: querystring.stringify({
            client_id: CLIENT_ID,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    if (!response.ok) {
        throw new Error('Failed to refresh token')
    }

    const tokenData: TokenData = await response.json()
    // Set the exact expiration time
    tokenData.expiration_time = Date.now() + tokenData.expires_in * 1000

    // Save the new token data back to the file
    fs.writeFileSync(TOKEN_FILE, JSON.stringify(tokenData))

    return tokenData
}
