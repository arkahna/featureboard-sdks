import {
    Tree,
    addProjectConfiguration,
    joinPathFragments,
    readProjectConfiguration,
} from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import { verify } from 'approvals/lib/Providers/Jest/JestApprovals'
import * as fs from 'fs/promises'
import fetchMock from 'jest-fetch-mock'
import * as path from 'path'

import { CodeGeneratorOptionsTree, codeGenerator } from './code-generator'

fetchMock.enableMocks()
describe('code-generator', () => {
    let tree: Tree
    let options: Omit<
        CodeGeneratorOptionsTree,
        'tree' | 'realitiveFilePath'
    > & { subFolder: string }
    beforeEach(async () => {
        tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' })

        const root = 'apps/my-app'
        addProjectConfiguration(tree, 'my-app', {
            root: 'apps/my-app',
            projectType: 'application',
            targets: { 'my-target': { executor: 'nx:noop' } },
        })
        tree.write(
            joinPathFragments(root, 'Project.FeatureBoard.MyApp.csproj'),
            '',
        )

        options = {
            organizationName: 'featureboard',
            subFolder: './',
            templateType: 'dotnet-api',
            dryRun: false,
            quiet: false,
            verbose: true,
            interactive: false,
            featureBoardprojectName: 'FeatureBoard Service',
            featureBoardKey: 'This is totaly a key',
        }

        fetchMock.mockIf(/^https?:\/\/api.featureboard.dev.*$/, async (req) => {
            const file = await fs.readFile(
                path.join(__dirname, '../test-data/feature-board.json'),
                {
                    encoding: 'utf8',
                },
            )
            return {
                status: 200,

                body: file,
            }
        })
    })

    it('should run successfully', async () => {
        let project = readProjectConfiguration(tree, 'my-app')
        await codeGenerator({
            tree: tree,
            realitiveFilePath: joinPathFragments(
                project.root,
                options.subFolder,
            ),
            ...options,
        })

        project = readProjectConfiguration(tree, 'my-app')
        expect(project).toBeDefined()
    })

    it('should produce the expected file', async () => {
        let project = readProjectConfiguration(tree, 'my-app')
        await codeGenerator({
            tree: tree,
            realitiveFilePath: joinPathFragments(
                project.root,
                options.subFolder,
            ),
            ...options,
        })
        const file = tree.read(
            joinPathFragments(project.root, options.subFolder, 'Features.cs'),
            'utf8',
        )
        project = readProjectConfiguration(tree, 'my-app')
        verify(file)
    })
})
