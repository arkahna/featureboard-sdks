import type { ExecutorContext, Tree } from '@nx/devkit'
import { addProjectConfiguration, joinPathFragments } from '@nx/devkit'
import * as fs from 'fs/promises'
import { HttpResponse, http } from 'msw'
import type { SetupServer } from 'msw/node'
import { setupServer } from 'msw/node'
import { createTreeWithEmptyWorkspace } from 'nx/src/devkit-testing-exports'
import * as path from 'path'
import { codeGenExecutor } from './executor'
import type { CodeGenExecutorSchema } from './schema'

describe('code-gen executor', () => {
    let context: ExecutorContext
    let tree: Tree
    let options: CodeGenExecutorSchema
    let server: SetupServer
    const root = '/virtual'
    const projectName = 'my-app'
    const projectRoot = `apps/${projectName}`

    beforeAll(() => {
        server = setupServer(
            http.get('https://api.featureboard.app/projects', async () => {
                const file = await fs.readFile(
                    path.join(__dirname, '../../../test-data/projects.json'),
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
        context = {
            root: root,
            cwd: root,
            projectName: projectName,
            targetName: 'lint',
            projectsConfigurations: {
                version: 2,
                projects: {
                    [projectName]: {
                        root: projectRoot,
                        sourceRoot: projectRoot,
                        targets: {
                            lint: {
                                executor: '@nx-dotnet/core:format',
                            },
                        },
                    },
                },
            },
            isVerbose: false,
        }

        options = {
            subFolder: './src/features',
            template: 'dotnet-api',
            featureBoardProductName: 'SaaSy Icons',
            featureBoardApiKey: 'This is totally a key',
            dryRun: true,
        }

        tree = createTreeWithEmptyWorkspace({ layout: 'apps-libs' })
        addProjectConfiguration(tree, projectName, {
            root: projectRoot,
            projectType: 'application',
            targets: { 'my-target': { executor: 'nx:noop' } },
        })
        tree.write(
            joinPathFragments(projectRoot, 'Project.FeatureBoard.MyApp.csproj'),
            '',
        )
    })

    describe('template: dotnet-api', () => {
        beforeEach(async () => {
            options.template = 'dotnet-api'
        })

        it('should run successfully', async () => {
            const output = await codeGenExecutor(options, context, tree)

            expect(output?.success).toBe(true)
        })

        it('should produce the expected features files', async () => {
            await codeGenExecutor(options, context, tree)
            const files = tree
                .listChanges()
                .filter(
                    (x) =>
                        x.path.match(/^apps\/my-app\/.*$/) &&
                        !x.path.endsWith('.csproj') &&
                        !x.path.endsWith('/project.json'),
                )

            expect(files).toHaveLength(1)
            files.forEach((x) => {
                expect(x.content?.toString('utf-8')).toMatchSnapshot(x.path)
            })
        })
    })

    describe('template: typescript', () => {
        beforeEach(async () => {
            options.template = 'typescript'
        })

        it('should run successfully', async () => {
            const output = await codeGenExecutor(options, context, tree)

            expect(output?.success).toBe(true)
        })

        it('should produce the expected features files', async () => {
            await codeGenExecutor(options, context, tree)
            const files = tree
                .listChanges()
                .filter(
                    (x) =>
                        x.path.match(/^apps\/my-app\/.*$/) &&
                        !x.path.endsWith('.csproj') &&
                        !x.path.endsWith('/project.json'),
                )

            expect(files).toHaveLength(1)
            files.forEach((x) => {
                expect(x.content?.toString('utf-8')).toMatchSnapshot(x.path)
            })
        })
    })

    afterEach(() => {
        server.resetHandlers()
    })

    afterAll(() => {
        server.close()
    })
})
