export type FeatureBoardAuth =
    | {
          featureBoardBearerToken: string
          organizationId: string
      }
    | {
          featureBoardApiKey: string
          organizationId?: string
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
        headers:
            'featureBoardBearerToken' in auth
                ? {
                      Authorization: `Bearer ${auth.featureBoardBearerToken}`,
                      Accept: 'application/json',
                      'X-Organization': auth.organizationId,
                  }
                : {
                      ['x-api-key']: auth.featureBoardApiKey,
                      Accept: 'application/json',
                      ...(auth.organizationId
                          ? { 'X-Organization': auth.organizationId }
                          : {}),
                  },
    }).then(async (response) => {
        if (response.ok) {
            return (await response.json()) as T
        }
        if (response.status === 401) {
            throw new Error(
                `Unauthorised call to the FeatureBoard API, ${
                    'featureBoardBearerToken' in auth
                        ? 'please authenticate by running `npx @featureboard/cli login`'
                        : 'please check your API key'
                }`,
            )
        }

        throw new Error(
            `Call to ${path} failed. Status Code: ${response.status} (${
                response.statusText
            }), Content: ${await response.text()}`,
        )
    })
}
