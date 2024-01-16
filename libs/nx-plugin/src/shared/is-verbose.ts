export function isVerbose(): boolean {
    return process.argv.some((x) => x === '--verbose')
}
