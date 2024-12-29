import BleDeviceScanner, { BleScannerOptions } from '../components/BleDeviceScanner'

export default class SpyBleScanner extends BleDeviceScanner {
    public constructor(options?: BleScannerOptions) {
        super(options)
    }

    public getIsScanning() {
        return this.isScanning
    }

    public getTimeoutMs() {
        return this.timeoutMs
    }

    public getUuids() {
        return this.uuids
    }

    public getPeripherals() {
        return this.peripherals
    }
}
