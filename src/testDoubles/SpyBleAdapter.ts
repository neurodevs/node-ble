import { Peripheral } from '@abandonware/noble'
import BleAdapterImpl from '../BleAdapter'

export default class SpyBleAdapter extends BleAdapterImpl {
    public constructor(peripheral: Peripheral) {
        super(peripheral)
    }

    public getPeripheral() {
        return this.peripheral
    }

    public getServices() {
        return this.services
    }

    public getCharacteristics() {
        return this.characteristics
    }

    public getLocalName() {
        return this.advertisement.localName
    }

    public getPeripheralRssi() {
        return this.peripheral.rssi
    }

    public get advertisement() {
        return this.peripheral.advertisement
    }
}
