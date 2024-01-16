import {
    getValidToken,
    readCurrentOrganization,
} from '@featureboard/api-authentication'
import type { FeatureBoardAuth } from '@featureboard/code-generator'
import { codeGenerator } from '@featureboard/code-generator'
import type { Tree } from '@nx/devkit'
import { joinPathFragments, readProjectConfiguration } from '@nx/devkit'
import { API_ENDPOINT, CLIENT_ID } from '../../shared/config'
import { isDryRun } from '../../shared/is-dry-run'
import { isVerbose } from '../../shared/is-verbose'
import type { CodeGenGeneratorSchema } from './schema'

export async function codeGenGenerator(
    tree: Tree,
    { projectName, ...options }: CodeGenGeneratorSchema,
): Promise<void> {
    const project = readProjectConfiguration(tree, projectName)
    const dryRun = isDryRun()
    const verbose = isVerbose()

    let auth: FeatureBoardAuth
    if (options.featureBoardApiKey) {
        auth = {
            featureBoardApiKey: options.featureBoardApiKey,
        }
    } else {
        const featureBoardBearerToken = await getValidToken(CLIENT_ID)
        const organizationId = await readCurrentOrganization(verbose)
        if (!featureBoardBearerToken || !organizationId) {
            return
        }

        auth = {
            featureBoardBearerToken,
            organizationId,
        }
    }

    await codeGenerator({
        tree: tree,
        relativeFilePath: joinPathFragments(project.root, options.subFolder),
        interactive: !dryRun,
        auth,
        apiEndpoint: API_ENDPOINT,
        ...options,
    })
}

export default codeGenGenerator
