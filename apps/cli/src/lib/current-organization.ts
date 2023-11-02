import fs from 'node:fs'
import path from 'node:path'
import { CONFIG_DIRECTORY } from './config'

const ORGANIZATION_FILE = path.join(CONFIG_DIRECTORY, 'organization.json')

export function writeCurrentOrganization(organizationId: string) {
    // Check if the directory exists, create it if not
    if (!fs.existsSync(CONFIG_DIRECTORY)) {
        fs.mkdirSync(CONFIG_DIRECTORY, { recursive: true })
    }

    fs.writeFileSync(ORGANIZATION_FILE, JSON.stringify(organizationId))
}

export async function readCurrentOrganization(
    verbose: boolean,
): Promise<string | undefined> {
    try {
        const rawData = fs.readFileSync(ORGANIZATION_FILE, 'utf-8')
        const organizationId = JSON.parse(rawData) as string
        if (organizationId && verbose) {
            console.log(`Current organization: ${organizationId}`)
        }
        return organizationId
    } catch (error) {
        return
    }
}
