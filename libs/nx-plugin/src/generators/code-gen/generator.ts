// eslint-disable-next-line @nx/enforce-module-boundaries
import { codeGenerator } from '@featureboard/cli'
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit'
import * as prompts from 'prompts'
import { CodeGenGeneratorSchema } from './schema'

export async function codeGenGenerator(
    tree: Tree,
    {
        projectName,
        dryRun,
        ...options
    }: CodeGenGeneratorSchema & {
        help: boolean
        dryRun: boolean
        quiet: boolean
        verbose: boolean
    },
): Promise<void> {
    console.log(options)
    const project = readProjectConfiguration(tree, projectName)

    let featureBoardBearerToken: string | undefined
    if (!dryRun && !options.featureBoardKey) {
        const result = await prompts([
            {
                type: 'password',
                name: 'bearerToken',
                message: `Enter your feature board bearer token:`,
                validate: (x) => !!x,
            },
        ])
        featureBoardBearerToken = result.bearerToken
    }

    await codeGenerator({
        tree: tree,
        realitiveFilePath: joinPathFragments(project.root, options.subFolder),
        interactive: !dryRun,
        featureBoardBearerToken,
        ...options,
    })
}

export default codeGenGenerator
