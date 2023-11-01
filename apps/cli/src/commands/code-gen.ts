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
import { titleText } from '../lib/title-text'

// Code Gen
const templateChoices: Template[] = ['dotnet-api']

export function codeGenCommand() {
    return new Command('code-gen')
        .description(`A Code generator for FeatureBoard`)
        .option('-p, --output-path <path>', 'Output path')
        .addOption(
            new Option(
                '-t, --template <template>',
                'Select the template ',
            ).choices(templateChoices),
        )
        .option('-k, --featureBoardKey <key>', 'FeatureBoard API key')
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

                const promptsSet: Array<prompts.PromptObject<string>> = []
                if (!options.outputPath) {
                    promptsSet.push({
                        type: 'text',
                        name: 'outputPath',
                        message: `Enter the output path for the generated code.`,
                        validate: (x) => !!x,
                    })
                }

                if (!options.template) {
                    if (
                        templateChoices.length == 1 &&
                        !options.nonInteractive
                    ) {
                        options.template = templateChoices[0]
                    } else {
                        promptsSet.push({
                            type: 'select',
                            name: 'template',
                            message: `Pick a template?`,
                            validate: (x) => templateChoices.includes(x),
                            choices: templateChoices.map((x) => ({
                                title: x,
                                value: x,
                            })),
                        })
                    }
                }

                if (!options.featureBoardKey) {
                    promptsSet.push({
                        type: 'password',
                        name: 'bearerToken',
                        message: `Enter your featureboard bearer token:`,
                        validate: (x) => !!x,
                    })
                }

                let bearerToken: string | undefined
                if (!options.nonInteractive && promptsSet.length >= 1) {
                    const result = await prompts(promptsSet)

                    options.template = options.template ?? result['template']
                    bearerToken = result['bearerToken']
                    options.outputPath =
                        options.outputPath ?? result['outputPath']
                }

                const sanitisedOutputPath = (options.outputPath ?? '').replace(
                    '../',
                    './',
                )
                const outputPath = path.join(process.cwd(), sanitisedOutputPath)
                try {
                    await fsAsync.access(outputPath)
                } catch {
                    throw new Error(`Output path doesn't exist: ${outputPath}`)
                }

                if (!options.template) throw new Error('Template is not set')
                if (!options.featureBoardKey && !bearerToken)
                    throw new Error(
                        options.nonInteractive
                            ? 'FeatureBoard Key is not set'
                            : 'Bearer token is not set',
                    )

                const tree = new FsTree(process.cwd(), options.verbose)
                await codeGenerator({
                    template: options.template as Template,
                    tree: tree,
                    relativeFilePath: sanitisedOutputPath,
                    featureBoardKey: options.featureBoardKey,
                    featureBoardBearerToken: bearerToken,
                    interactive: !options.nonInteractive,
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
