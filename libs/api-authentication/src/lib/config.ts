import os from 'node:os'
import path from 'node:path'

export const CONFIG_DIRECTORY = path.join(os.homedir(), `.featureboard`)
