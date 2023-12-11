import { codeGenerator } from '@featureboard/code-generator'
import type { Tree } from '@nx/devkit'
import { joinPathFragments, readProjectConfiguration } from '@nx/devkit'
import { isDryRun } from '../../shared/is-dry-run'
import type { CodeGenExecutorSchema } from './schema'

export async function codeGenExecutor(
    tree: Tree,
    { projectName, ...options }: CodeGenExecutorSchema,
) {
    const project = readProjectConfiguration(tree, projectName)
    const dryRun = isDryRun()

    await codeGenerator({
        tree: tree,
        relativeFilePath: joinPathFragments(project.root, options.subFolder),
        interactive: !dryRun,
        auth: { featureBoardApiKey: options.featureBoardApiKey },
        ...options,
    })
}
export default codeGenExecutor
