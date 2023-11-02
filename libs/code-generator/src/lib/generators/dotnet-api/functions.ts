import * as path from 'path'
import type { Tree } from '../../tree/tree'

export function toPascalCase(str: string) {
    return (
        str
            ?.match(
                /[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g,
            )
            ?.map((x) => x.charAt(0).toUpperCase() + x.slice(1).toLowerCase())
            .join('') ?? ''
    )
}

export function toDotNetType(feature: any) {
    switch (feature.dataType.kind) {
        case 'boolean':
            return 'bool'
        case 'number':
            return 'decimal'
        case 'options':
            return toPascalCase(feature.key)
        default:
            return feature.dataType.kind
    }
}

export function getDotNetNameSpace(tree: Tree, filePath: string): string {
    const files = tree.children(filePath)
    const namespace = files
        .find((x) => x.endsWith('.csproj'))
        ?.replace('.csproj', '')

    if (namespace) return namespace

    const parentDir = path.resolve(filePath, '..')
    if (parentDir == filePath) throw new Error("Can't find .net project file")
    return `${getDotNetNameSpace(tree, parentDir)}.${path.dirname(filePath)}`
}
