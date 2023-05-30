export function compareArrays<T>(a: T[], b: T[]): boolean {
    if (a.length !== b.length) {
        return false
    }
    return (
        a
            .filter((x): x is T => !!x)
            .sort()
            .join('') ===
        b
            .filter((y): y is T => !!y)
            .sort()
            .join('')
    )
}
