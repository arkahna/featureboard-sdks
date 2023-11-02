import { codeGenerator } from '@featureboard/code-generator'
import type { Tree } from '@nx/devkit'
import { joinPathFragments, readProjectConfiguration } from '@nx/devkit'
import { isDryRun } from '../../Shared/is-dry-run'
import type { CodeGenGeneratorSchema } from './schema'

export async function codeGenGenerator(
    tree: Tree,
    { projectName, ...options }: CodeGenGeneratorSchema,
): Promise<void> {
    const project = readProjectConfiguration(tree, projectName)
    const dryRun = isDryRun()

    await codeGenerator({
        tree: tree,
        relativeFilePath: joinPathFragments(project.root, options.subFolder),
        interactive: !dryRun,
        auth: {
            featureBoardApiKey: options.featureBoardApiKey,
        },
        ...options,
    })
}

export default codeGenGenerator
