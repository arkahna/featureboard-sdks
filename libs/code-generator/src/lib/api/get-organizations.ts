export async function getUserOrganizations(
    apiEndpoint: string,
    featureBoardBearerToken: string,
) {
    return await queryFeatureBoardNoOrg<{
        organizations: { id: string; name: string }[]
    }>(apiEndpoint, 'my-organizations', { featureBoardBearerToken })
}

/**
 * @param apiEndpoint The endpoint to query (eg https://api.featureboard.app) with no trailing /
 */
async function queryFeatureBoardNoOrg<T>(
    apiEndpoint: string,
    path: string,
    auth: { featureBoardBearerToken: string },
) {
    return fetch(`${apiEndpoint}/${path}`, {
        headers: {
            ['Authorization']: `Bearer ${auth.featureBoardBearerToken}`,
        },
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
