export function getAllEndpoint(httpEndpoint: string) {
    return httpEndpoint.endsWith('/')
        ? `${httpEndpoint}all`
        : `${httpEndpoint}/all`
}
