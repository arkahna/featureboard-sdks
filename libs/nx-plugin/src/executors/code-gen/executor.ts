import {
    getValidToken,
    readCurrentOrganization,
} from '@featureboard/api-authentication'
import {
    codeGenerator,
    saveChanges,
    type FeatureBoardAuth,
} from '@featureboard/code-generator'
import { joinPathFragments, type ExecutorContext, type Tree } from '@nx/devkit'
import { FsTree } from 'nx/src/generators/tree'
import { API_ENDPOINT, CLIENT_ID } from '../../shared/config'
import type { CodeGenExecutorSchema } from './schema'

export async function codeGenExecutor(
    options: CodeGenExecutorSchema,
    context: ExecutorContext,
    tree?: Tree,
) {
    console.log('codeGenExecutor', options)
    if (!context.projectName) {
        throw new Error('No projectName: name not found in in project.json')
    }

    const projectRoot =
        context.projectsConfigurations?.projects[context.projectName]?.root

    if (!projectRoot) {
        console.error(`Error: Cannot find root for ${context.projectName}.`)
        return {
            success: false,
        }
    }

    let auth: FeatureBoardAuth
    if (options.featureBoardApiKey) {
        auth = {
            featureBoardApiKey: options.featureBoardApiKey,
        }
    } else {
        const featureBoardBearerToken = await getValidToken(CLIENT_ID)
        const organizationId = await readCurrentOrganization(context.isVerbose)
        if (!featureBoardBearerToken || !organizationId) {
            return
        }

        auth = {
            featureBoardBearerToken,
            organizationId,
        }
    }

    tree = tree || new FsTree(context.root, context.isVerbose)

    await codeGenerator({
        tree: tree,
        relativeFilePath: joinPathFragments(projectRoot, options.subFolder),
        interactive: false,
        auth,
        apiEndpoint: API_ENDPOINT,
        ...options,
    })
    saveChanges(tree, options.dryRun, context.isVerbose)

    return {
        success: true,
    }
}

export default codeGenExecutor
