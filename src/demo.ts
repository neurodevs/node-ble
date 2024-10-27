import { exit } from 'process'
import BleScannerImpl from './BleScanner'

async function main() {
    const scanner = BleScannerImpl.Create({
        defaultDurationMs: 1000,
        defaultTimeoutMs: 1000,
    })

    const result = await scanner.scanAll()
    console.log('Result:\n\n', result)

    exit(0)
}

main().catch(console.error)
