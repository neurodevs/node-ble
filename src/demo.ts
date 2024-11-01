import { exit } from 'process'
import BleScannerImpl from './BleScanner'

async function main() {
    const scanner = BleScannerImpl.Create({
        defaultDurationMs: 5000,
        defaultTimeoutMs: 5000,
    })

    const result = await scanner.scanForName('CGX Quick-Series Headset')
    console.log('Result:\n\n', result)

    exit(0)
}

main().catch(console.error)
