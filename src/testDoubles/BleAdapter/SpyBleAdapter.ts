import { LoggableType } from '@sprucelabs/spruce-skill-utils'
import BleDeviceAdapter, {
    BleAdapterConstructorOptions,
} from '../../components/BleDeviceAdapter'

export default class SpyBleAdapter extends BleDeviceAdapter {
    public infoLogs: string[] = []
    public warnLogs: string[] = []
    public errorLogs: string[] = []

    public constructor(options: BleAdapterConstructorOptions) {
        super(options)
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

    public getCharacteristicCallbacks() {
        return this.characteristicCallbacks
    }

    public get localName() {
        return this.advertisement.localName
    }

    public get peripheralRssi() {
        return this.peripheral.rssi
    }

    public get advertisement() {
        return this.peripheral.advertisement
    }

    public getIsIntentionalDisconnect() {
        return this.isIntentionalDisconnect
    }

    public getRssiIntervalMs() {
        return this.rssiIntervalMs
    }

    public setLogInfoSpy() {
        this.infoLogs = []

        this.log.info = (...args: LoggableType[]) => {
            const message = args.join(' ')
            this.infoLogs.push(message)
            return message
        }
    }

    public setLogWarnSpy() {
        this.warnLogs = []

        this.log.warn = (...args: LoggableType[]) => {
            const message = args.join(' ')
            this.warnLogs.push(message)
            return message
        }
    }

    public setLogErrorSpy() {
        this.errorLogs = []

        this.log.error = (...args: LoggableType[]) => {
            const message = args.join(' ')
            this.errorLogs.push(message)
            return message
        }
    }

    public setState(
        state:
            | 'error'
            | 'connecting'
            | 'connected'
            | 'disconnecting'
            | 'disconnected'
    ) {
        this.peripheral.state = state
    }

    public resetTestDouble() {
        this.infoLogs = []
        this.warnLogs = []
        this.errorLogs = []
    }
}
