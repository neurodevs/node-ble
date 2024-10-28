import { generateId } from '@sprucelabs/test-utils'
import {
    Characteristic,
    Service,
    ServicesAndCharacteristics,
} from '@abandonware/noble'
import FakeCharacteristic from './FakeCharacteristic'

export default class FakePeripheral implements SimplePeripheral {
    public callsToConstructor: PeripheralOptions[] = []
    public didCallConnect = false
    public didCallConnectAsync = false
    public numCallsToDiscoverAllServicesAndCharacteristicsAsync = 0
    public callsToOn: CallToOn[] = []

    public uuid: string
    public advertisement: {
        localName: string
        manufacturerData: Buffer
    }
    public rssi = Math.random() * 100
    public connectable = true

    public constructor(options?: PeripheralOptions) {
        this.callsToConstructor.push(options ?? {})

        const { uuid = generateId(), localName = generateId() } = options ?? {}

        this.uuid = uuid

        this.advertisement = {
            localName,
            manufacturerData: Buffer.from([0x01, 0x02, 0x03, 0x04]),
        }
    }

    public async connectAsync() {
        this.didCallConnectAsync = true
    }

    public async discoverAllServicesAndCharacteristicsAsync() {
        this.numCallsToDiscoverAllServicesAndCharacteristicsAsync++
        return this.fakeServicesAndCharacteristics
    }

    public on(event: 'rssiUpdate', listener: (rssi: number) => void) {
        this.callsToOn.push({ event, listener })
    }

    public fakeServicesAndCharacteristics: ServicesAndCharacteristics = {
        services: [],
        characteristics: [],
    }

    public setFakeServices(services: Service[]) {
        this.fakeServicesAndCharacteristics.services = services
    }

    public setFakeCharacteristics(characteristics: FakeCharacteristic[]) {
        this.fakeServicesAndCharacteristics.characteristics =
            characteristics as unknown as Characteristic[]
    }

    public get fakeServices() {
        return this.fakeServicesAndCharacteristics.services
    }

    public get fakeCharacteristics() {
        return this.fakeServicesAndCharacteristics.characteristics
    }

    public resetFakeServicesAndCharacteristics() {
        this.fakeServicesAndCharacteristics = {
            services: [],
            characteristics: [],
        }
    }

    public resetTestDouble() {
        this.callsToConstructor = []
        this.didCallConnect = false
        this.didCallConnectAsync = false
        this.numCallsToDiscoverAllServicesAndCharacteristicsAsync = 0
        this.resetFakeServicesAndCharacteristics()
    }
}

export interface SimplePeripheral {
    uuid: string
    advertisement: {
        localName: string
        manufacturerData: Buffer
    }
    rssi: number
    connectable: boolean
    connectAsync(): Promise<void>
    discoverAllServicesAndCharacteristicsAsync(): Promise<ServicesAndCharacteristics>
    on(event: string, listener: (arg?: any) => void): void
}

export interface PeripheralOptions {
    uuid?: string
    localName?: string
}

export interface CallToOn {
    event: 'rssiUpdate'
    listener: (arg?: any) => void
}
