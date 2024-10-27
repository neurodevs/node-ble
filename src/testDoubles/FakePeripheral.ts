import { generateId } from '@sprucelabs/test-utils'
import {
    Characteristic,
    Service,
    ServicesAndCharacteristics,
} from '@abandonware/noble'

export default class FakePeripheral implements SimplePeripheral {
    public numCallsToDiscoverAllCharacteristicsAndServicesAsync = 0

    public uuid: string
    public advertisement: {
        localName: string
        manufacturerData: Buffer
    }
    public rssi = Math.random() * 100
    public connectable = true

    public callsToConstructor: PeripheralOptions[] = []
    public didCallConnect = false
    public didCallConnectAsync = false

    public constructor(options?: PeripheralOptions) {
        this.callsToConstructor.push(options ?? {})

        const { uuid = generateId(), localName = generateId() } = options ?? {}

        this.uuid = uuid

        this.advertisement = {
            localName,
            manufacturerData: Buffer.from([0x01, 0x02, 0x03, 0x04]),
        }
    }

    public connect() {
        this.didCallConnect = true
    }

    public async connectAsync() {
        this.didCallConnectAsync = true
    }

    public async discoverAllCharacteristicsAndServicesAsync() {
        this.numCallsToDiscoverAllCharacteristicsAndServicesAsync++
        return this.fakeServicesAndCharacteristics
    }

    public fakeServicesAndCharacteristics: ServicesAndCharacteristics = {
        services: [],
        characteristics: [],
    }

    public setFakeServices(services: Service[]) {
        this.fakeServicesAndCharacteristics.services = services
    }

    public setFakeCharacteristics(characteristics: Characteristic[]) {
        this.fakeServicesAndCharacteristics.characteristics = characteristics
    }

    public resetTestDouble() {
        this.callsToConstructor = []
        this.didCallConnect = false
        this.didCallConnectAsync = false
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
    connect(): void
    connectAsync(): Promise<void>
    discoverAllCharacteristicsAndServicesAsync(): Promise<ServicesAndCharacteristics>
}

export interface PeripheralOptions {
    uuid?: string
    localName?: string
}
