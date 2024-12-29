import { LoggableType } from '@sprucelabs/spruce-skill-utils'
import { Peripheral } from '@abandonware/noble'
import BleDeviceAdapter from '../../components/BleDeviceAdapter'

export default class SpyBleAdapter extends BleDeviceAdapter {
    public callsToConstructor: CallToConstructor[] = []
    public infoLogs: string[] = []
    public warnLogs: string[] = []
    public errorLogs: string[] = []

    public constructor(peripheral: Peripheral, rssiIntervalMs: number) {
        super(peripheral, rssiIntervalMs)
        this.callsToConstructor.push({ peripheral, rssiIntervalMs })
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

export interface CallToConstructor {
    peripheral: Peripheral
    rssiIntervalMs: number
}
