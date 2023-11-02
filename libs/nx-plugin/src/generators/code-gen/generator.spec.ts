import type { Tree } from '@nx/devkit'
import {
    addProjectConfiguration,
    joinPathFragments,
    readProjectConfiguration,
} from '@nx/devkit'
import { createTreeWithEmptyWorkspace } from '@nx/devkit/testing'
import * as fs from 'fs/promises'
import { HttpResponse, http } from 'msw'
import type { SetupServer } from 'msw/node'
import { setupServer } from 'msw/node'
import * as path from 'path'
import { codeGenGenerator } from './generator'
import type { CodeGenGeneratorSchema } from './schema'

describe('code-generator', () => {
    let tree: Tree
    let options: CodeGenGeneratorSchema
    let server: SetupServer
    describe('template: dotnet-api', () => {
        beforeAll(() => {
            server = setupServer(
                http.get('https://api.featureboard.app/projects', async () => {
                    const file = await fs.readFile(
                        path.join(
                            __dirname,
                            '../../../test-data/projects.json',
                        ),
                        {
                            encoding: 'utf8',
                        },
                    )
                    return HttpResponse.json(JSON.parse(file))
                }),
                http.get(
                    'https://api.featureboard.app/projects/ivu5ntxbxeeorm248jl25bs6/features',
                    async () => {
                        const file = await fs.readFile(
                            path.join(
                                __dirname,
                                '../../../test-data/features-ivu5ntxbxeeorm248jl25bs6.json',
                            ),
                            {
                                encoding: 'utf8',
                            },
                        )
                        return HttpResponse.json(JSON.parse(file))
                    },
                ),
            )
            server.listen({ onUnhandledRequest: 'error' })
        })

        beforeEach(async () => {
            tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' })

            options = {
                projectName: 'my-app',
                subFolder: './',
                template: 'dotnet-api',
                featureBoardProjectName: 'SaaSy Icons',
                featureBoardApiKey: 'This is totally a key',
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
            await codeGenGenerator(tree, options)

            project = readProjectConfiguration(tree, options.projectName)
            expect(project).toBeDefined()
        })

        it('should produce the expected features files', async () => {
            let project = readProjectConfiguration(tree, options.projectName)
            await codeGenGenerator(tree, options)

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
