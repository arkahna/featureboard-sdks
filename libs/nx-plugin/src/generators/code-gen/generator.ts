// eslint-disable-next-line @nx/enforce-module-boundaries
import { CodeGenerator } from '@featureboard/cli'
import { Tree, readProjectConfiguration } from '@nx/devkit'
import * as path from 'path'
import * as prompts from 'prompts'
import { CodeGenGeneratorSchema } from './schema'

export async function codeGenGenerator(
    tree: Tree,
    {
        projectName,
        ...options
    }: CodeGenGeneratorSchema & {
        help: boolean
        dryRun: boolean
        quiet: boolean
        verbose: boolean
    },
): Promise<void> {
    const project = readProjectConfiguration(tree, projectName)

    let featureBoardBearerToken: string | undefined
    if (!options.featureBoardKey) {
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

    await CodeGenerator({
        outputPath: path.join(tree.root, project.root, options.subFolder),
        interactive: true,
        featureBoardBearerToken,
        ...options,
    })
}

export default codeGenGenerator
