import { codeGenerator } from '@featureboard/code-generator'
import type { Tree } from '@nx/devkit'
import { joinPathFragments, readProjectConfiguration } from '@nx/devkit'
import prompts from 'prompts'
import { isDryRun } from '../../Shared/is-dry-run'
import type { CodeGenGeneratorSchema } from './schema'

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

export default codeGenGenerator
