import { getUserOrganizations } from '@featureboard/code-generator'
import prompts from 'prompts'
import { API_ENDPOINT } from './config'

export async function promptForOrganization(bearerToken: string) {
    const organisationResults = await getUserOrganizations(
        API_ENDPOINT,
        bearerToken,
    )
    let currentOrganization: string | undefined

    if (!organisationResults.organizations.length) {
        throw new Error('No organizations found')
    } else if (organisationResults.organizations.length === 1) {
        currentOrganization = organisationResults.organizations[0].id
        console.log(
            `One organization found. Setting FeatureBoard organization to ${currentOrganization}`,
        )
    } else {
        const promptResult = await prompts({
            type: 'select',
            name: 'organization',
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

        currentOrganization = promptResult.organization
    }

    return currentOrganization
}
