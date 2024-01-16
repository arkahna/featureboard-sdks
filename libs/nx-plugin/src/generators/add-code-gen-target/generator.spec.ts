import type { Tree } from '@nx/devkit'
import { addProjectConfiguration, readProjectConfiguration } from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'

import { addCodeGenTargetGenerator } from './generator'
import type { AddCodeGenTargetGeneratorSchema } from './schema'

describe('AddCodeGenTarget generator', () => {
    let tree: Tree
    let options: AddCodeGenTargetGeneratorSchema

    beforeEach(() => {
        tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' })

        options = {
            projectName: 'my-app',
            template: 'dotnet-api',
            featureBoardProductName: 'SaaSy Icons',
            targetName: 'saasy-icons',
            subFolder: './src/features',
            dryRun: false,
        }

        addProjectConfiguration(tree, options.projectName, {
            root: `apps/${options.projectName}`,
            projectType: 'application',
            targets: { 'my-target': { executor: 'nx:noop' } },
        })
    })

    it('should run successfully', async () => {
        await addCodeGenTargetGenerator(tree, options)
        const project = readProjectConfiguration(tree, options.projectName)
        expect(project).toBeDefined()
    })

    it('should update the project.json', async () => {
        await addCodeGenTargetGenerator(tree, options)

        const projectJson = tree
            .listChanges()
            .find((x) => x.path.endsWith('project.json'))
        expect(projectJson).toBeDefined()
        expect(projectJson?.content?.toString('utf-8')).toMatchSnapshot(
            projectJson?.path,
        )
    })
})
