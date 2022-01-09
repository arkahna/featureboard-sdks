export function getEffectiveEndpoint(
    httpEndpoint: string,
    currentAudiences: string[],
) {
    return httpEndpoint.endsWith('/')
        ? `${httpEndpoint}effective?audiences=${currentAudiences.join(',')}`
        : `${httpEndpoint}/effective?audiences=${currentAudiences.join(',')}`
}
