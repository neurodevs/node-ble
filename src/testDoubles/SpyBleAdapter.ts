import { LoggableType } from '@sprucelabs/spruce-skill-utils'
import { Peripheral } from '@abandonware/noble'
import BleAdapterImpl from '../BleAdapter'

export default class SpyBleAdapter extends BleAdapterImpl {
    public infoLogs: string[] = []

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
        return this.getAdvertisement().localName
    }

    public getPeripheralRssi() {
        return this.peripheral.rssi
    }

    public getAdvertisement() {
        return this.peripheral.advertisement
    }

    public setLogInfoSpy() {
        this.log.info = (...args: LoggableType[]) => {
            const message = args.join(' ')
            this.infoLogs.push(message)
            return message
        }
    }

    public resetTestDouble() {
        this.infoLogs = []
    }
}
