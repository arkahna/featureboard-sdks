import { Command } from '@commander-js/extra-typings'
import {
    TOKEN_URL,
    writeToken,
    type TokenData,
} from '@featureboard/api-authentication'
import http from 'http'
import open from 'open'
import prompts from 'prompts'
import querystring from 'querystring'
import { actionRunner } from '../lib/action-runner'
import { AUTH_URL, CLIENT_ID, REDIRECT_PORT, REDIRECT_URI } from '../lib/config'
import { generateCodeChallenge, generateCodeVerifier } from '../lib/pkce'
import { titleText } from '../lib/title-text'

export function loginCommand() {
    return new Command('login')
        .description(`Login to FeatureBoard on the CLI`)
        .option(
            '-v, --verbose',
            'Verbose output, show additional logging and tracing',
            false,
        )
        .option(
            '-n, --nonInteractive',
            "Don't prompt for missing options",
            !!process.env['CI'],
        )
        .action(
            actionRunner(async function login(options) {
                if (!options.nonInteractive) {
                    console.log(titleText)
                }

                prompts.override(options)

                const server = await startLoginServer()
                // Handle graceful shutdown
                process.on('SIGINT', () => {
                    server.close(() => {
                        console.log('Server closed')
                        process.exit()
                    })
                })

                server.listen(REDIRECT_PORT, 'localhost', async () => {
                    if (options.nonInteractive) {
                        console.log(
                            `Please authenticate at: http://localhost:${REDIRECT_PORT}`,
                        )
                    } else {
                        console.log(
                            `Please authenticate at the browser window that has been opened for you or visit http://localhost:${REDIRECT_PORT}.`,
                        )
                        // Automatically open the authentication URL in the default browser
                        await open(`http://localhost:${REDIRECT_PORT}`)
                    }
                })
            }),
        )
}

async function startLoginServer() {
    let codeVerifier: string // Store the verifier to use it later

    const server = http.createServer(async (req, res) => {
        if (req.url?.startsWith('/callback')) {
            const parsedUrl = new URL(req.url, REDIRECT_URI)
            const authCode = parsedUrl.searchParams.get('code')

            if (authCode) {
                try {
                    // Exchange the authCode for tokens
                    const response = await fetch(TOKEN_URL, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: querystring.stringify({
                            client_id: CLIENT_ID,
                            code: authCode,
                            code_verifier: codeVerifier,
                            redirect_uri: `${REDIRECT_URI}/callback`,
                            grant_type: 'authorization_code',
                        }),
                    })

                    const tokenData: TokenData = await response.json()
                    // Set the exact expiration time
                    tokenData.expiration_time =
                        Date.now() + tokenData.expires_in * 1000

                    // Save token data to file
                    writeToken(tokenData)

                    res.writeHead(200, { 'Content-Type': 'text/plain' })
                    res.end(
                        'Authentication successful! You can close this page.',
                    )
                    console.log('Authentication successful!')
                } catch (error) {
                    console.error(
                        'Error occurred while exchanging the token.',
                        error,
                    )
                    res.writeHead(500, { 'Content-Type': 'text/plain' })
                    res.end('Error occurred while exchanging the token.')
                }
            } else {
                res.writeHead(400, { 'Content-Type': 'text/plain' })
                res.end(
                    'No authorization code found in the callback. Please try again.',
                )
            }

            server.close() // Close server after processing the callback
        } else {
            // Generate PKCE values
            codeVerifier = generateCodeVerifier()
            const codeChallenge = generateCodeChallenge(codeVerifier)

            // Construct the new authentication URL with the code challenge
            const pkceAuthUrl = `${AUTH_URL}&code_challenge=${codeChallenge}&code_challenge_method=S256&prompt=select_account`

            // Redirect to the Microsoft authentication page with PKCE challenge
            res.writeHead(302, { Location: pkceAuthUrl })
            res.end()
        }
    })

    return server
}
