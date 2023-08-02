import { Command, Option } from '@commander-js/extra-typings'
import * as figlet from 'figlet'
import fs from 'fs/promises'
import path from 'path'
import { exit } from 'process'
import prompts from 'prompts'
import CodeGenerator, { TemplateType } from './code-generator'

const titleText = figlet.textSync('Feature Board CLI')

const program = new Command()
    .description(`${titleText}\nA Code generator for feature board`)
    .version('1.0.0') // how do we set this dynamicly
    .option('-q, --quite', 'No output', false)

if (!process.argv.slice(2).length) {
    program.outputHelp()
    exit(0)
}

const templateTypeChoices = ['dotnet-api']
const codeGenCommand = program
    .command('code-gen')
    .description('A Code generator for feature board')
    .requiredOption('-p, --output-path <path>', 'Output location')
    .addOption(
        new Option('-t, --templateType <template>', 'Select the template type')
            // .default('dotnet-api')
            .choices(templateTypeChoices),
    )
    .option('-o, --organization <organization>', 'Feature board Organization')
    .option('-k, --featureBoardKey <key>', 'Feature board key')
    .option('-d, --dryRun', 'Dry run show what files have changed', false)
    .option('-q, --quite', 'No output', false)
    .option('-q, --verbose', 'Verbose output', false)
    .option('-n, --nonInteractive', "Don't prompt for missing options", false)
    .action(async (options) => {
        const outputPath = path.join(process.cwd(), options.outputPath)
        try {
            await fs.access(outputPath)
        } catch {
            throw new Error(`Output path doesn't exist: ${outputPath}`)
        }
        const promptsSet: Array<prompts.PromptObject<string>> = []
        if (!options.templateType) {
            if (templateTypeChoices.length == 1 && !options.nonInteractive)
                options.templateType = templateTypeChoices[0]
            else
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
        if (!options.organization) {
            promptsSet.push({
                type: 'text',
                name: 'organization',
                message: `Enter your feature board organization:`,
                validate: (x) => !!x,
            })
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

            options.templateType = options.templateType ?? result.templateType
            options.organization = options.organization ?? result.organization
            bearerToken = result.bearerToken
            console.log(result, options.templateType)
        }

        if (!options.templateType) throw new Error('Template type is not set')
        if (!options.organization) throw new Error('Organization is not set')
        if (!options.featureBoardKey && !bearerToken)
            throw new Error('Feature Board Key is not set')

        console.log(options)
        CodeGenerator({
            templateType: options.templateType as TemplateType,
            outputPath: outputPath,
            organizationName: options.organization,
            featureBoardKey: options.featureBoardKey,
            featureBoardBearerToken: bearerToken,
            dryRun: options.dryRun,
            quiet: options.quite,

            verbose: options.verbose,
            interactive: !options.nonInteractive,
        })
    })

// const bobCommand = program
//     .command('bob')
//     .description('A Code generator for feature board')
//     // .option('-o, --output', 'Output location')
//     .option('-d, --dryRun', 'Dry run show what files have changed', false)
//     .option('-q, --quite', 'No output', false)
//     //
//     // .option(
//     //     '-t, --templateType <value>',
//     //     'Select the template type [dotnet-api]',
//     //     'dotnet-api',
//     // )
//     .action((a, b, c, d) => console.log(a, b, c, d))

//const programOptions = program.opts()

// if (!programOptions.quite) console.log(figlet.textSync('Feature Board CLI'))

console.log(
    program.opts(),
    codeGenCommand.opts(),
    // bobCommand.opts(),
    process.argv,
)
program.parse()
