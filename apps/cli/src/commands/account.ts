import { Command } from '@commander-js/extra-typings'
import prompts from 'prompts'
import { actionRunner } from '../lib/action-runner'
import { readCurrentOrganization } from '../lib/current-organization'
import { getValidToken } from '../lib/get-valid-token'

export function accountCommand() {
    return new Command('account')
        .description(
            `Select an organization to work with FeatureBoard on the CLI`,
        )
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
            actionRunner(async function codeGen(options) {
                prompts.override(options)

                let bearerToken: string | undefined
                if (!options.nonInteractive) {
                    const token = await getValidToken()
                    if (!token) {
                        return
                    }
                    bearerToken = token
                }

                if (!bearerToken) {
                    console.log('Not logged in')
                    return
                }

                const decodedToken = parseJwt(bearerToken)

                console.log(
                    JSON.stringify(
                        {
                            id: decodedToken.oid,
                            name: decodedToken.name,
                            upn: decodedToken.upn,
                            tenantId: decodedToken.tid,
                            unique_name: decodedToken.unique_name,
                            currentOrganization: await readCurrentOrganization(
                                options.verbose,
                            ),
                        },
                        null,
                        2,
                    ),
                )
            }),
        )
}

function parseJwt(token: string) {
    return JSON.parse(
        Buffer.from(token.split('.')[1], 'base64').toString(),
    ) as Record<string, string>
}
