import path from 'node:path'
import prompts from 'prompts'
import {
    getDotNetNameSpace,
    toDotNetType,
    toPascalCase,
} from './templates/functions'
import { generateFiles } from './templates/generate-files'
import type { Tree } from './tree/tree'

export type Template = 'dotnet-api'

export interface CodeGeneratorOptions {
    template: Template
    organizationId?: string
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardProjectName?: string
    apiEndpoint?: string

    interactive: boolean

    tree: Tree
    relativeFilePath: string
}

export async function codeGenerator(
    options: CodeGeneratorOptions,
): Promise<void> {
    const features = await getFeatures(options)
    if (!features) {
        return
    }
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
            features: features,
        },
    )
}

async function getFeatures({
    featureBoardProjectName,
    featureBoardOrganization,
    featureBoardKey,
    featureBoardBearerToken,
    interactive,
    apiEndpoint = 'https://api.featureboard.app',
}: {
    interactive: boolean
    featureBoardKey?: string
    featureBoardBearerToken?: string
    featureBoardProjectName?: string
    featureBoardOrganization?: string
    apiEndpoint?: string
}): Promise<null | FeatureBoardFeature[]> {
    const headers: HeadersInit = {}

    if (featureBoardKey) headers['x-api-key'] = featureBoardKey
    else if (featureBoardBearerToken) {
        headers['Authorization'] = `Bearer ${featureBoardBearerToken}`

        if (interactive && !featureBoardOrganization) {
            const organisationResults = await queryFeatureBoard<{
                organizations: { id: string; name: string }[]
            }>(apiEndpoint, 'my-organizations', headers)

            if (!organisationResults.organizations.length) {
                throw new Error('No organizations found')
            } else if (organisationResults.organizations.length === 1) {
                featureBoardOrganization =
                    organisationResults.organizations[0].id
                console.log(
                    `One organization found. Setting FeatureBoard organization to ${featureBoardOrganization}`,
                )
            } else {
                const promptResult = await prompts({
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

                featureBoardOrganization = promptResult.organizations
            }
        }
        if (!featureBoardOrganization) throw new Error("Organization isn't set")

        headers['X-Organization'] = featureBoardOrganization
    } else throw new Error('Auth token not set')

    const projectResults = await queryFeatureBoard<{
        projects: Array<{ id: string; name: string }>
    }>(apiEndpoint, 'projects', headers)

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
                return null
            }

            project = promptResult.project
        }
    }
    if (!project) throw new Error('Unable to locate Project')

    const featuresResult = await queryFeatureBoard<{
        features: FeatureBoardFeature[]
    }>(apiEndpoint, `projects/${project.id}/features`, headers)

    return featuresResult.features
}

interface FeatureBoardFeature {
    name: string
    created: string
    key: string
    categoryIds: string[]
    description: string
    dataType:
        | {
              kind: 'boolean'
          }
        | {
              kind: 'number'
          }
        | {
              kind: 'string'
          }
        | {
              kind: 'options'
              options: string[]
          }
    audienceExceptions: {
        audienceId: string
        value: string | number | boolean
    }[]
    defaultValue: string | number | boolean
}

/**
 *
 * @param apiEndpoint The endpoint to query (eg https://api.featureboard.app) with no trailing /
 * @param path
 * @param headers
 * @returns
 */
async function queryFeatureBoard<T>(
    apiEndpoint: string,
    path: string,
    headers: HeadersInit,
) {
    return fetch(`${apiEndpoint}/${path}`, {
        headers: headers,
    }).then(async (response) => {
        if (response.ok) {
            return (await response.json()) as T
        }

        throw new Error(
            `Call to ${path} failed. Status Code: ${response.status} (${
                response.statusText
            }), Content: ${await response.text()}`,
        )
    })
}
