import type { TargetConfiguration, Tree } from '@nx/devkit'
import {
    readProjectConfiguration,
    updateProjectConfiguration,
} from '@nx/devkit'
import type { CodeGenExecutorSchema } from '../../executors/code-gen/schema'
import type { AddCodeGenTargetGeneratorSchema } from './schema'

export async function addCodeGenTargetGenerator(
    tree: Tree,
    options: AddCodeGenTargetGeneratorSchema,
) {
    const project = readProjectConfiguration(tree, options.projectName)
    project.targets ??= {}

    project.targets[options.targetName ?? 'code-gen'] = {
        ...getCodeGenExecutorConfiguration(options),
    }

    updateProjectConfiguration(tree, options.projectName, project)
}

/**
 * Returns a TargetConfiguration for the @featureboard/nx-plugin:code-gen executor
 */
export function getCodeGenExecutorConfiguration(
    options: CodeGenExecutorSchema,
): CodeGenExecutorConfiguration {
    const codeGenOptions: CodeGenExecutorConfiguration['options'] = {
        template: options.template,
        featureBoardProductName: options.featureBoardProductName,
        subFolder: options.subFolder,
    }
    if (options.dryRun) {
        codeGenOptions.dryRun = true
    }
    return {
        executor: '@featureboard/nx-plugin:code-gen',
        outputs: [`{projectRoot}/${options.subFolder}`.replace('/./', '')],
        options: codeGenOptions,
        dependsOn: ['build'],
    }
}

/**
 * Configuration options relevant for the executor
 */
export type CodeGenExecutorConfiguration = TargetConfiguration & {
    executor: '@featureboard/nx-plugin:code-gen'
    options: CodeGenExecutorSchema & { dryRun?: boolean }
}

export default addCodeGenTargetGenerator
