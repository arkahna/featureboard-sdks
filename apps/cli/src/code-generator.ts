import { Tree, formatFiles, generateFiles } from '@nx/devkit'
import { printChanges } from 'nx/src/command-line/generate/generate'
import { FsTree, flushChanges } from 'nx/src/generators/tree'
import * as path from 'path'
import prompts from 'prompts'
import { FeatureDto } from './models/feature-dto'
import { OrganizationDto } from './models/organization-dto'
import { ProjectExtendedDto } from './models/project-extended-dto'
import {
    getDotNetNameSpace,
    getDotNetNameSpaceFromNx,
    toDotNetType,
    toPascalCase,
} from './templates/functions'

export type TemplateType = 'dotnet-api'

export type CodeGeneratorOptions = {
    templateType: TemplateType
    organizationId?: string
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardprojectName?: string

    quiet: boolean
    verbose: boolean
    interactive: boolean
}

export type CodeGeneratorOptionsPath = CodeGeneratorOptions & {
    dryRun: boolean
    outputPath: string
}
export type CodeGeneratorOptionsTree = CodeGeneratorOptions & {
    tree: Tree
    realitiveFilePath: string
}

export async function codeGenerator(
    options: CodeGeneratorOptionsPath,
): Promise<void>
export async function codeGenerator(
    options: CodeGeneratorOptionsTree,
): Promise<void>
export async function codeGenerator(
    options: CodeGeneratorOptionsPath | CodeGeneratorOptionsTree,
): Promise<void> {
    const features = await getFeatures(options)

    let tree: Tree | undefined
    let srcFolder = './'
    let runSaveChanges: boolean
    let dryRun: boolean
    if ('tree' in options) {
        tree = options.tree
        srcFolder = options.realitiveFilePath
        runSaveChanges = false
        dryRun = false
    } else {
        tree = new FsTree(options.outputPath, options.verbose)
        runSaveChanges = true
        dryRun = options.dryRun
    }

    const templateSpecificOptions: any = {}
    switch (options.templateType) {
        case 'dotnet-api':
            templateSpecificOptions.namespace =
                'tree' in options
                    ? await getDotNetNameSpaceFromNx(
                          tree,
                          options.realitiveFilePath,
                      )
                    : getDotNetNameSpace(options.outputPath)
    }

    generateFiles(
        tree,
        path.join(__dirname, 'templates', options.templateType),
        srcFolder,
        {
            toPascalCase,
            toDotNetType,
            ...templateSpecificOptions,
            features: features,
        },
    )

    await formatFiles(tree)
    if (runSaveChanges) saveChanges(tree, { quiet: options.quiet, dryRun })
}

async function getFeatures({
    featureBoardprojectName,
    featureBoardKey,
    featureBoardBearerToken,
    interactive,
}: {
    interactive: boolean
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardprojectName?: string
}): Promise<FeatureDto[]> {
    const headers: HeadersInit = {}

    if (featureBoardKey) headers['x-api-key'] = featureBoardKey
    else if (featureBoardBearerToken) {
        headers.Authorization = `Bearer ${featureBoardBearerToken}`

        let organizationId: string | undefined
        if (interactive) {
            const orgnisationResults = await queryFeatureBoard<{
                organizations: OrganizationDto[]
            }>('my-organizations', headers)

            if (orgnisationResults.organizations.length === 1) {
                organizationId = orgnisationResults.organizations[0].id
                console.log(
                    `One orgnization found. Setting feature board orgnization to ${organizationId}`,
                )
            } else {
                const promptResult = await prompts({
                    type: 'select',
                    name: 'organizations',
                    message: `Pick your feature board orgnisation?`,
                    validate: (x) =>
                        orgnisationResults.organizations
                            .map((x) => x.name)
                            .includes(x),
                    choices: orgnisationResults.organizations.map((x) => ({
                        title: x.name,
                        value: x.id,
                    })),
                })

                organizationId = promptResult.organizations
            }
        }
        if (!organizationId) throw new Error("organizationId isn't set")

        headers['X-Organization'] = organizationId
    } else throw new Error('Auth token not set')

    const projectResults = await queryFeatureBoard<{
        projects: ProjectExtendedDto[]
    }>('projects?deep=true', headers)

    let project = projectResults.projects.find(
        (x: any) =>
            x.name.toLowerCase() ===
            featureBoardprojectName?.toLocaleLowerCase(),
    )
    if (!project && interactive) {
        if (projectResults.projects.length === 1) {
            project = projectResults.projects[0]
            console.log(
                `One project found. Setting feature board project to ${project.name}`,
            )
        } else {
            const promptResult = await prompts({
                type: 'select',
                name: 'project',
                message: `Pick feature board project?`,
                validate: (x) =>
                    projectResults.projects.map((x) => x.name).includes(x),
                choices: projectResults.projects.map((x) => ({
                    title: x.name,
                    value: x,
                })),
            })

            project = promptResult.project
        }
    }
    if (!project) throw new Error('Unable to locate Project')

    return project.features
}

async function queryFeatureBoard<T>(endpoint: string, headers: HeadersInit) {
    return fetch(`https://api.featureboard.dev/${endpoint}`, {
        headers: headers,
    }).then(async (response) => {
        if (response.ok) {
            return (await response.json()) as T
        }
        throw new Error(
            `Unable to reretrieve roject data from feature board. Status Code: ${
                response.status
            } (${response.statusText}), Content: ${await response.text()}`,
        )
    })
}

function saveChanges(
    tree: Tree,
    options: {
        dryRun: boolean
        quiet: boolean
    },
) {
    const changes = tree.listChanges()
    if (!options.quiet) {
        printChanges(changes)
        if (changes.length === 0) {
            console.log(`\nFiles are the same no changes were made.`)
            return
        }
    }

    if (!options.dryRun && changes.length !== 0) {
        flushChanges(tree.root, changes)
        return
    }
    console.log(`\nNOTE: The "dryRun" flag means no changes were made.`)
}
