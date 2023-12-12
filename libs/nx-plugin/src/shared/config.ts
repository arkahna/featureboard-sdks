import { z } from 'zod'

export const { CLIENT_ID, API_ENDPOINT } = z
    .object({
        CLIENT_ID: z.string().default('0c9ab007-c465-4f10-9dc3-f0d5cbe05619'),
        API_ENDPOINT: z.string().default('https://api.featureboard.app'),
    })
    .parse(process.env)
