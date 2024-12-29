import { exit } from 'process'
import BleDeviceScanner from './components/BleDeviceScanner'

async function main() {
    const scanner = BleDeviceScanner.Create({
        defaultDurationMs: 5000,
        defaultTimeoutMs: 5000,
    })

    const result = await scanner.scanForName('CGX Quick-Series Headset')
    console.log('Result:\n\n', result)

    exit(0)
}

main().catch(console.error)
