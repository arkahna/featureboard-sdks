import { Tree, formatFiles, generateFiles } from '@nx/devkit'
import { printChanges } from 'nx/src/command-line/generate/generate'
import { FsTree, flushChanges } from 'nx/src/generators/tree'
import * as path from 'path'
import prompts from 'prompts'
import { FeatureDto } from './feature-dto'
import {
    getDotNetNameSpace,
    getDotNetNameSpaceFromNx,
    toDotNetType,
    toPascalCase,
} from './templates/functions'

export type TemplateType = 'dotnet-api'

type CodeGeneratorOptions = {
    templateType: TemplateType
    organizationName: string
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardprojectName?: string

    dryRun: boolean
    quiet: boolean
    verbose: boolean
    interactive: boolean
}

export type CodeGeneratorOptionsPath = CodeGeneratorOptions & {
    outputPath: string
}
export type CodeGeneratorOptionsTree = CodeGeneratorOptions & {
    tree: Tree
    realitiveFilePath: string
}

export async function codeGenerator(
    options: CodeGeneratorOptionsTree,
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
    let runSaveChanges = true
    if ('tree' in options) {
        tree = options.tree
        srcFolder = options.realitiveFilePath
        runSaveChanges = false
    } else {
        tree = new FsTree(options.outputPath, options.verbose)
        runSaveChanges = true
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
    if (runSaveChanges) saveChanges(tree, options)
}

async function getFeatures({
    organizationName,
    featureBoardprojectName,
    featureBoardKey,
    featureBoardBearerToken,
    interactive,
}: {
    organizationName: string
    interactive: boolean
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardprojectName?: string
}): Promise<FeatureDto[]> {
    const headers: HeadersInit = {
        'X-Organization': organizationName,
    }

    if (featureBoardKey) headers['x-api-key'] = featureBoardKey
    else if (featureBoardBearerToken)
        headers.Authorization = `Bearer ${featureBoardBearerToken}`
    else throw new Error('Auth token not set')

    const result = await fetch(
        'https://api.featureboard.dev/projects?deep=true',
        {
            headers: headers,
        },
    ).then(async (response) => {
        if (response.ok) {
            return await response.json()
        }
        throw new Error(
            `Unable to reretrieve roject data from feature board. Status Code: ${
                response.status
            } (${response.statusText}), Content: ${await response.text()}`,
        )
    })

    let project = result.projects.find(
        (x: any) =>
            x.name.toLowerCase() ===
            featureBoardprojectName?.toLocaleLowerCase(),
    )
    if (!project && interactive) {
        if (result.projects.length === 1) {
            project = result.projects[0]
            console.log(
                `One project found. Setting feature board project to ${project.name}`,
            )
        } else {
            const promptResult = await prompts({
                type: 'select',
                name: 'project',
                message: `Pick feature board project?`,
                validate: (x) =>
                    result.projects.map((x: any) => x.name).includes(x),
                choices: result.projects.map((x: any) => ({
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
