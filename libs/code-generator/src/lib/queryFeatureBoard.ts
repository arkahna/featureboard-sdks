export type FeatureBoardAuth =
    | {
          featureBoardBearerToken: string
          organizationId: string
          featureBoardApiKey?: undefined
      }
    | {
          featureBoardApiKey: string
          organizationId?: string
          featureBoardBearerToken?: undefined
      }

/**
 * @param apiEndpoint The endpoint to query (eg https://api.featureboard.app) with no trailing /
 */
export async function queryFeatureBoard<T>(
    apiEndpoint: string,
    path: string,
    auth: FeatureBoardAuth,
) {
    return fetch(`${apiEndpoint}/${path}`, {
        headers: auth.featureBoardBearerToken
            ? {
                  Authorization: `Bearer ${auth.featureBoardBearerToken}`,
                  Accept: 'application/json',
                  'X-Organization': auth.organizationId,
              }
            : auth.featureBoardApiKey
            ? {
                  ['x-api-key']: auth.featureBoardApiKey,
                  Accept: 'application/json',
                  ...(auth.organizationId
                      ? { 'X-Organization': auth.organizationId }
                      : {}),
              }
            : // Shouldn't need this branch, unsure why typescript is not narrowing the else branch automatically
              {},
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
