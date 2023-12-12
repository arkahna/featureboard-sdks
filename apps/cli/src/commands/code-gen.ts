import { Command, Option } from '@commander-js/extra-typings'
import {
    getValidToken,
    readCurrentOrganization,
} from '@featureboard/api-authentication'
import type { Template } from '@featureboard/code-generator'
import {
    FsTree,
    codeGenerator,
    flushChanges,
    printChanges,
} from '@featureboard/code-generator'
import fsAsync from 'fs/promises'
import path from 'node:path'
import prompts from 'prompts'
import { actionRunner } from '../lib/action-runner'
import { API_ENDPOINT, CLIENT_ID } from '../lib/config'
import { promptForOrganization } from '../lib/prompt-for-organization'
import { titleText } from '../lib/title-text'

// Code Gen
const templateChoices: Template[] = ['dotnet-api', 'typescript']

export function codeGenCommand() {
    return new Command('code-gen')
        .description(`A Code generator for FeatureBoard`)
        .option('-o, --output <path>', 'Output path')
        .option('-g, --organizationId <id>', 'The Organization Id')
        .addOption(
            new Option(
                '-t, --template <template>',
                'Select the template ',
            ).choices(templateChoices),
        )
        .option(
            '-k, --featureBoardApiKey <key>',
            'FeatureBoard API key',
            process.env.FEATUREBOARD_API_KEY,
        )
        .option('-p, --product <name>', 'FeatureBoard product name')
        .option('-d, --dryRun', 'Dry run show what files have changed', false)
        .option('-q, --quiet', "Don't show file changes", false)
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
                if (!options.nonInteractive) {
                    console.log(titleText)
                }

                prompts.override(options)

                if (!options.template && !options.nonInteractive) {
                    const promptResult = await prompts({
                        type: 'select',
                        name: 'template',
                        message: `Pick a template?`,
                        validate: (x) => templateChoices.includes(x),
                        choices: templateChoices.map((x) => ({
                            title: x,
                            value: x,
                        })),
                    })

                    if (!('template' in promptResult)) {
                        return
                    }

                    options.template = promptResult.template
                }

                if (!options.output && !options.nonInteractive) {
                    const promptResult = await prompts({
                        type: 'text',
                        name: 'output',
                        message: `Enter the output path for the generated code.`,
                        validate: (x) => !!x,
                    })

                    if (!('output' in promptResult)) {
                        return
                    }

                    options.output = promptResult.output
                }
                const outputAbsolutePath = path.join(
                    process.cwd(),
                    options.output!,
                )
                try {
                    await fsAsync.access(outputAbsolutePath)
                } catch {
                    throw new Error(
                        `Output path doesn't exist: ${outputAbsolutePath}`,
                    )
                }

                let bearerToken: string | undefined
                if (!options.featureBoardApiKey && !options.nonInteractive) {
                    const token = await getValidToken(CLIENT_ID)
                    if (!token) {
                        return
                    }
                    bearerToken = token
                }

                let currentOrganization =
                    options.organizationId ??
                    (await readCurrentOrganization(options.verbose))

                if (
                    bearerToken &&
                    !currentOrganization &&
                    !options.nonInteractive
                ) {
                    currentOrganization =
                        await promptForOrganization(bearerToken)
                }

                if (!currentOrganization) {
                    throw new Error("Organization isn't set")
                }

                const tree = new FsTree(process.cwd(), options.verbose)
                await codeGenerator({
                    template: options.template as Template,
                    tree: tree,
                    relativeFilePath: options.output!,
                    featureBoardProductName: options.product,
                    auth: bearerToken
                        ? {
                              featureBoardBearerToken: bearerToken,
                              organizationId: currentOrganization,
                          }
                        : {
                              featureBoardApiKey: options.featureBoardApiKey,
                              organizationId: currentOrganization,
                          },

                    interactive: !options.nonInteractive,
                    apiEndpoint: API_ENDPOINT,
                })

                const changes = tree.listChanges()
                if (!options.quiet) {
                    printChanges(changes)
                    if (changes.length === 0) {
                        console.log(
                            `\nFiles are the same no changes were made.`,
                        )
                        return
                    }
                }

                if (!options.dryRun && changes.length !== 0) {
                    flushChanges(tree.root, changes)
                    return
                }
                console.log(
                    `\nNOTE: The "dryRun" flag means no changes were made.`,
                )
            }),
        )
}
