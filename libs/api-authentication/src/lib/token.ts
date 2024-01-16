import fs from 'node:fs'
import path from 'node:path'
import querystring from 'node:querystring'
import { CONFIG_DIRECTORY } from './config'

export interface TokenData {
    access_token: string
    token_type: string
    expires_in: number
    refresh_token: string
    expiration_time?: number // We'll store the exact expiration time for easier checks
}

export const TOKEN_URL =
    'https://login.microsoftonline.com/common/oauth2/v2.0/token'
const TOKEN_FILE = path.join(CONFIG_DIRECTORY, 'token.json')

export function writeToken(tokenData: TokenData) {
    // Check if the directory exists, create it if not
    if (!fs.existsSync(CONFIG_DIRECTORY)) {
        fs.mkdirSync(CONFIG_DIRECTORY, { recursive: true })
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
    clientId: string,
): Promise<TokenData> {
    const response = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: querystring.stringify({
            client_id: clientId,
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
