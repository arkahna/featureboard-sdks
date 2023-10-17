import { codeGenerator } from '@featureboard/code-generator'
import { Tree, joinPathFragments, readProjectConfiguration } from '@nx/devkit'
import * as prompts from 'prompts'
import { CodeGenGeneratorSchema } from './schema'

export async function codeGenGenerator(
    tree: Tree,
    { projectName, ...options }: CodeGenGeneratorSchema,
): Promise<void> {
    const project = readProjectConfiguration(tree, projectName)
    const dryRun = isDryRun()

    let featureBoardBearerToken: string | undefined
    if (!dryRun && !options.featureBoardKey) {
        const result = await prompts([
            {
                type: 'password',
                name: 'bearerToken',
                message: `Enter your FeatureBoard bearer token:`,
                validate: (x) => !!x,
            },
        ])
        featureBoardBearerToken = result.bearerToken
    }

    await codeGenerator({
        tree: tree,
        relativeFilePath: joinPathFragments(project.root, options.subFolder),
        interactive: !dryRun,
        featureBoardBearerToken,
        ...options,
    })
}

export function isDryRun(): boolean {
    return process.argv.some((x) => x === '--dry-run')
}

export default codeGenGenerator
