import { formatFiles, generateFiles } from '@nx/devkit'
import { printChanges } from 'nx/src/command-line/generate/generate'
import { FsTree, flushChanges } from 'nx/src/generators/tree'
import * as path from 'path'
import prompts from 'prompts'
import {
    getDotNetNameSpace,
    toDotNetType,
    toPascalCase,
} from './templates/functions'

export type TemplateType = 'dotnet-api'

export async function CodeGenerator(options: {
    templateType: TemplateType
    outputPath: string
    organizationName: string
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardprojectName?: string

    dryRun: boolean
    quiet: boolean
    verbose: boolean
    interactive: boolean
}): Promise<void> {
    const features = await getFeatures(options)

    const templateSpecificOptions: any = {}

    switch (options.templateType) {
        case 'dotnet-api':
            templateSpecificOptions.namespace = await getDotNetNameSpace(
                options.outputPath,
            )
    }

    const tree = new FsTree(options.outputPath, options.verbose)
    generateFiles(
        tree,
        path.join(__dirname, 'templates', options.templateType),
        './',
        {
            toPascalCase,
            toDotNetType,
            ...templateSpecificOptions,
            features: features,
        },
    )
    await formatFiles(tree)

    SaveChanges(tree, options)
}

export default CodeGenerator

async function getFeatures({
    organizationName,
    projectName,
    featureBoardKey,
    featureBoardBearerToken,
    interactive,
}: {
    organizationName: string
    interactive: boolean
    featureBoardKey?: string
    featureBoardBearerToken?: string
    projectName?: string
}) {
    const headers: HeadersInit = {
        'X-Organization': organizationName,
    }

    if (featureBoardBearerToken)
        headers.Authorization = `Bearer ${featureBoardBearerToken}`
    else if (featureBoardKey) headers['x-api-key'] = featureBoardKey
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
        (x: any) => x.name.toLowerCase() === projectName?.toLocaleLowerCase(),
    )
    if (!project && interactive) {
        if (result.projects.length === 1) {
            project = result.projects[0]
            console.log(
                `One project found setting feature board project to ${project.name}`,
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

function SaveChanges(
    tree: FsTree,
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
