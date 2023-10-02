import * as fs from 'fs/promises'
import { rest } from 'msw/'
import { SetupServer, setupServer } from 'msw/node'
import * as path from 'path'
import { FsTree, Tree } from './tree/tree'

import { CodeGeneratorOptions, codeGenerator } from './code-generator'

describe('code-generator', () => {
    let tree: Tree
    let options: Omit<CodeGeneratorOptions, 'tree' | 'relativeFilePath'> & {
        subFolder: string
    }
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
                                './test-data/projects-deep.json',
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
            const cwd = process.cwd()
            tree = new FsTree(cwd, true)

            const subFolder = 'apps/my-app'
            tree.write(
                path.join(subFolder, 'Project.FeatureBoard.MyApp.csproj'),
                '',
            )

            options = {
                subFolder: subFolder,
                templateType: 'dotnet-api',
                interactive: false,
                featureBoardProjectName: 'SaaSy Icons',
                featureBoardKey: 'This is totally a key',
            }
        })

        it('should run successfully', async () => {
            await codeGenerator({
                tree: tree,
                relativeFilePath: options.subFolder,
                ...options,
            })
        })

        it('should produce the expected features files', async () => {
            await codeGenerator({
                tree: tree,
                relativeFilePath: options.subFolder,
                ...options,
            })

            const files = tree
                .listChanges()
                .filter((x) => x.path.match(/^apps\/my-app\/.*$/))

            expect(files).toHaveLength(2)
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