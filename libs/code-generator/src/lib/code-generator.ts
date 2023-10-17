import fetch from 'cross-fetch'
import * as path from 'path'
import prompts from 'prompts'
import {
    getDotNetNameSpace,
    toDotNetType,
    toPascalCase,
} from './templates/functions'
import { generateFiles } from './templates/generate-files'
import { Tree } from './tree/tree'

// HACK this works around the different import strategies that the cli vs the nx plugin have.
// As we can't change the ones for the plugin as they come from NX
const promptsInternal: typeof prompts =
    typeof prompts == 'function' ? prompts : require('prompts')

export type TemplateType = 'dotnet-api'

export type CodeGeneratorOptions = {
    templateType: TemplateType
    organizationId?: string
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardProjectName?: string

    interactive: boolean

    tree: Tree
    relativeFilePath: string
}

export async function codeGenerator(
    options: CodeGeneratorOptions,
): Promise<void> {
    const features = await getFeatures(options)
    const relativeFilePath = options.relativeFilePath

    const templateSpecificOptions: any = {}
    switch (options.templateType) {
        case 'dotnet-api':
            templateSpecificOptions.namespace = getDotNetNameSpace(
                options.tree,
                relativeFilePath,
            )
    }

    await generateFiles(
        options.tree,
        path.join(__dirname, 'templates', options.templateType),
        options.relativeFilePath,
        {
            toPascalCase,
            toDotNetType,
            ...templateSpecificOptions,
            features: features,
        },
    )
}

async function getFeatures({
    featureBoardProjectName,
    featureBoardKey,
    featureBoardBearerToken,
    interactive,
}: {
    interactive: boolean
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardProjectName?: string
}): Promise<any[]> {
    const headers: HeadersInit = {}

    if (featureBoardKey) headers['x-api-key'] = featureBoardKey
    else if (featureBoardBearerToken) {
        headers['Authorization'] = `Bearer ${featureBoardBearerToken}`

        let organizationId: string | undefined
        if (interactive) {
            const organisationResults = await queryFeatureBoard<{
                organizations: { id: string; name: string }[]
            }>('my-organizations', headers)

            if (organisationResults.organizations.length === 1) {
                organizationId = organisationResults.organizations[0].id
                console.log(
                    `One organization found. Setting FeatureBoard organization to ${organizationId}`,
                )
            } else {
                const promptResult = await promptsInternal({
                    type: 'select',
                    name: 'organizations',
                    message: `Pick your FeatureBoard organisation?`,
                    validate: (x) =>
                        organisationResults.organizations
                            .map((x) => x.name)
                            .includes(x),
                    choices: organisationResults.organizations.map((x) => ({
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
        projects: { name: string; features: any[] }[]
    }>('projects?deep=true', headers)

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
            const promptResult = await promptsInternal({
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
            `Unable to retrieve project data from FeatureBoard. Status Code: ${
                response.status
            } (${response.statusText}), Content: ${await response.text()}`,
        )
    })
}
