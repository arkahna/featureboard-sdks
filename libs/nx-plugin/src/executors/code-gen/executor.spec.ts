import type { Tree } from '@nx/devkit'
import {
    addProjectConfiguration,
    joinPathFragments,
    readProjectConfiguration,
} from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import * as fs from 'fs/promises'
import { rest } from 'msw/'
import type { SetupServer } from 'msw/node'
import { setupServer } from 'msw/node'
import * as path from 'path'
import { codeGenExecutor } from './executor'
import type { CodeGenExecutorSchema } from './schema'

describe('code-Executor', () => {
    let tree: Tree
    let options: CodeGenExecutorSchema
    let server: SetupServer
    describe('templateType: dotnet-api', () => {
        beforeAll(() => {
            server = setupServer(
                rest.get(
                    'https://api.featureboard.dev/projects',
                    async (req, res, ctx) => {
                        const file = await fs.readFile(
                            path.join(
                                __dirname,
                                '../../../test-data/projects-deep.json',
                            ),
                            {
                                encoding: 'utf8',
                            },
                        )
                        return res(ctx.status(200), ctx.json(JSON.parse(file)))
                    },
                ),
            )
            server.listen()
        })

        beforeEach(async () => {
            tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' })

            options = {
                projectName: 'my-app',
                subFolder: './',
                templateType: 'dotnet-api',
                featureBoardProjectName: 'SaaSy Icons',
                featureBoardKey: 'This is totally a key',
            }

            const root = 'apps/my-app'
            addProjectConfiguration(tree, options.projectName, {
                root: `apps/${options.projectName}`,
                projectType: 'application',
                targets: { 'my-target': { executor: 'nx:noop' } },
            })
            tree.write(
                joinPathFragments(root, 'Project.FeatureBoard.MyApp.csproj'),
                '',
            )
        })

        it('should run successfully', async () => {
            let project = readProjectConfiguration(tree, options.projectName)
            await codeGenExecutor(tree, options)

            project = readProjectConfiguration(tree, options.projectName)
            expect(project).toBeDefined()
        })

        it('should produce the expected features files', async () => {
            let project = readProjectConfiguration(tree, options.projectName)
            await codeGenExecutor(tree, options)

            project = readProjectConfiguration(tree, options.projectName)
            const files = tree
                .listChanges()
                .filter((x) => x.path.match(/^apps\/my-app\/.*$/))

            expect(files).toHaveLength(3)
            files.forEach((x) => {
                expect(x.content?.toString('utf-8')).toMatchSnapshot(x.path)
            })
        })

        afterEach(() => {
            server.resetHandlers()
        })

        afterAll(() => {
            server.close()
        })
    })
})
