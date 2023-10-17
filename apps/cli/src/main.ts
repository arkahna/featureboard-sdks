#!/usr/bin/env node

import { Command, Option } from '@commander-js/extra-typings'
import {
    FsTree,
    TemplateType,
    codeGenerator,
    flushChanges,
    printChanges,
} from '@featureboard/code-generator'
import * as figlet from 'figlet'
import fs from 'fs/promises'
import path from 'path'
import { exit } from 'process'
import prompts from 'prompts'
import * as packageJson from '../package.json'

const titleText = figlet.textSync(`FeatureBoard CLI V${packageJson.version}`)

const program = new Command()
    .description(`${titleText}\nA Code generator for FeatureBoard`)
    .version(packageJson.version)
    .option('-q, --quiet', 'No output', false)

if (!process.argv.slice(2).length) {
    program.outputHelp()
    exit(0)
}

// Code Gen
const templateTypeChoices = ['dotnet-api']
program
    .command('code-gen')
    .description('A Code generator for feature board')
    .option('-p, --output-path <path>', 'Output path')
    .addOption(
        new Option(
            '-t, --templateType <template>',
            'Select the template type',
        ).choices(templateTypeChoices),
    )
    .option('-k, --featureBoardKey <key>', 'FeatureBoard api key')
    .option('-d, --dryRun', 'Dry run show what files have changed', false)
    .option('-q, --quiet', 'No output', false)
    .option('-q, --verbose', 'Verbose output', false)
    .option(
        '-n, --nonInteractive',
        "Don't prompt for missing options",
        !!process.env['CI'],
    )
    .action(async (options) => {
        if (!options.quiet) console.log(titleText)

        const promptsSet: Array<prompts.PromptObject<string>> = []
        if (!options.outputPath) {
            promptsSet.push({
                type: 'text',
                name: 'outputPath',
                message: `Enter the output path for the generated code.`,
                validate: (x) => !!x,
            })
        }

        if (!options.templateType) {
            if (templateTypeChoices.length == 1 && !options.nonInteractive) {
                options.templateType = templateTypeChoices[0]
            } else {
                promptsSet.push({
                    type: 'select',
                    name: 'templateType',
                    message: `Pick a template Type?`,
                    validate: (x) => templateTypeChoices.includes(x),
                    choices: templateTypeChoices.map((x) => ({
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
                message: `Enter your feature board bearer token:`,
                validate: (x) => !!x,
            })
        }

        let bearerToken: string | undefined
        if (!options.nonInteractive && promptsSet.length >= 1) {
            const result = await prompts(promptsSet)

            options.templateType =
                options.templateType ?? result['templateType']
            bearerToken = result['bearerToken']
            options.outputPath = options.outputPath ?? result['outputPath']
        }

        const sanitisedOutputPath = (options.outputPath ?? '').replace(
            '../',
            './',
        )
        const outputPath = path.join(process.cwd(), sanitisedOutputPath)
        try {
            await fs.access(outputPath)
        } catch {
            throw new Error(`Output path doesn't exist: ${outputPath}`)
        }

        if (!options.templateType) throw new Error('Template type is not set')
        if (!options.featureBoardKey && !bearerToken)
            throw new Error(
                options.nonInteractive
                    ? 'Feature Board Key is not set'
                    : 'Bearer token is not set',
            )

        const tree = new FsTree(process.cwd(), options.verbose)
        await codeGenerator({
            templateType: options.templateType as TemplateType,
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
                console.log(`\nFiles are the same no changes were made.`)
                return
            }
        }

        if (!options.dryRun && changes.length !== 0) {
            flushChanges(tree.root, changes)
            return
        }
        console.log(`\nNOTE: The "dryRun" flag means no changes were made.`)
    })

program.parse()
