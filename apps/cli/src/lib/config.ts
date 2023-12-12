import { z } from 'zod'

export const { CLIENT_ID, API_ENDPOINT } = z
    .object({
        CLIENT_ID: z.string().default('0c9ab007-c465-4f10-9dc3-f0d5cbe05619'),
        API_ENDPOINT: z.string().default('https://api.featureboard.app'),
    })
    .parse(process.env)

// 3524 is alphanumeric for 'FLAG' (on a phone keypad)
export const REDIRECT_PORT = 3524
export const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`
export const AUTH_URL = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
    REDIRECT_URI,
)}/callback&scope=${CLIENT_ID}/.default offline_access`
