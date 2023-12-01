import path from 'node:path'
import prompts from 'prompts'
import type {
    FeatureBoardFeature,
    FeatureBoardProject,
} from './api/get-project-features'
import { getProjectFeatures } from './api/get-project-features'
import { getProjects } from './api/get-projects'
import {
    getDotNetNameSpace,
    toDotNetType,
    toPascalCase,
} from './generators/dotnet-api/functions'
import { generateFiles } from './generators/dotnet-api/generate-files'
import type { FeatureBoardAuth } from './queryFeatureBoard'
import type { Tree } from './tree/tree'

export type Template = 'dotnet-api' | 'typescript'

export interface CodeGeneratorOptions {
    template: Template
    auth: FeatureBoardAuth
    apiEndpoint?: string
    featureBoardProjectName?: string

    interactive: boolean

    tree: Tree
    relativeFilePath: string
}

export async function codeGenerator(
    options: CodeGeneratorOptions,
): Promise<void> {
    const [project, features] = await getFeatures(options)
    if (!project || !features) {
        return
    }
    console.log(project)
    const relativeFilePath = options.relativeFilePath

    const templateSpecificOptions: any = {}
    switch (options.template) {
        case 'dotnet-api':
            templateSpecificOptions.namespace = getDotNetNameSpace(
                options.tree,
                relativeFilePath,
            )
    }

    await generateFiles(
        options.tree,
        path.join(__dirname, 'templates', options.template),
        options.relativeFilePath,
        {
            toPascalCase,
            toDotNetType,
            ...templateSpecificOptions,
            project,
            features: features,
        },
    )
}

async function getFeatures({
    featureBoardProjectName,
    auth,
    interactive,
    apiEndpoint = 'https://api.featureboard.app',
}: {
    interactive: boolean
    auth: FeatureBoardAuth
    featureBoardProjectName?: string
    apiEndpoint?: string
}): Promise<[null | FeatureBoardProject, null | FeatureBoardFeature[]]> {
    const projectResults = await getProjects(apiEndpoint, auth)

    let project = projectResults.projects.find(
        (x: any) =>
            x.name.toLowerCase() ===
            featureBoardProjectName?.toLocaleLowerCase(),
    )

    if (!project && interactive) {
        if (projectResults.projects.length === 1) {
            project = projectResults.projects[0]
            console.log(
                `One project found. Setting FeatureBoard project to ${project.name}`,
            )
        } else {
            const promptResult = await prompts({
                type: 'select',
                name: 'project',
                message: `Pick your FeatureBoard project?`,
                validate: (x) =>
                    projectResults.projects.map((x) => x.name).includes(x),
                choices: projectResults.projects.map((x) => ({
                    title: x.name,
                    value: x,
                })),
            })

            if (!promptResult) {
                return [null, null]
            }

            project = promptResult.project
        }
    }
    if (!project) throw new Error('Unable to locate Project')

    const featuresResult = await getProjectFeatures(apiEndpoint, project, auth)

    return [project, featuresResult.features]
}
