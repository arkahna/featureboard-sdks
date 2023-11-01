import { Command, Option } from '@commander-js/extra-typings'
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
import { API_ENDPOINT } from '../lib/config'
import { getValidToken } from '../lib/get-valid-token'
import { titleText } from '../lib/title-text'

// Code Gen
const templateChoices: Template[] = ['dotnet-api']

export function codeGenCommand() {
    return new Command('code-gen')
        .description(`A Code generator for FeatureBoard`)
        .option('-o, --output <path>', 'Output path')
        .addOption(
            new Option(
                '-t, --template <template>',
                'Select the template ',
            ).choices(templateChoices),
        )
        .option(
            '-k, --featureBoardKey <key>',
            'FeatureBoard API key',
            process.env.FEATUREBOARD_API_KEY,
        )
        .option('-p, --project <name>', 'FeatureBoard project name')
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

                let bearerToken: string | undefined
                if (!options.featureBoardKey && !options.nonInteractive) {
                    const token = await getValidToken()
                    if (!token) {
                        return
                    }
                    bearerToken = token
                }

                const outputPath = path.join(process.cwd(), options.output!)
                try {
                    await fsAsync.access(outputPath)
                } catch {
                    throw new Error(`Output path doesn't exist: ${outputPath}`)
                }

                const tree = new FsTree(process.cwd(), options.verbose)
                await codeGenerator({
                    template: options.template as Template,
                    tree: tree,
                    relativeFilePath: options.output!,
                    featureBoardKey: options.featureBoardKey,
                    featureBoardBearerToken: bearerToken,
                    featureBoardProjectName: options.project,
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
