import { Command } from '@commander-js/extra-typings'
import prompts from 'prompts'
import { actionRunner } from '../lib/action-runner'
import { writeCurrentOrganization } from '../lib/current-organization'
import { getValidToken } from '../lib/get-valid-token'
import { promptForOrganization } from '../lib/prompt-for-organization'
import { titleText } from '../lib/title-text'

export function selectOrganizationCommand() {
    return new Command('select-organization')
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
        .option('-g, --organizationId <id>', 'The Orgnization Id')
        .action(
            actionRunner(async function codeGen(options) {
                if (!options.nonInteractive) {
                    console.log(titleText)
                }

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
                    throw new Error('Not logged in')
                }

                const selectedOrganization =
                    options.organizationId ??
                    (await promptForOrganization(bearerToken))

                if (selectedOrganization) {
                    writeCurrentOrganization(selectedOrganization)
                    console.log(
                        `Set current organization to ${selectedOrganization}`,
                    )
                }
            }),
        )
}
