import {
    Characteristic,
    Service,
    ServicesAndCharacteristics,
} from '@abandonware/noble'
import generateId from '@neurodevs/generate-id'
import FakeCharacteristic from './FakeCharacteristic'

export default class FakePeripheral implements SimplePeripheral {
    public callsToConstructor: PeripheralOptions[] = []
    public numCallsToConnectAsync = 0
    public numCallsToDisconnectAsync = 0
    public numCallsToDiscoverAllServicesAndCharacteristicsAsync = 0
    public numCallsToUpdateRssiAsync = 0
    public callsToOn: PeripheralEventAndListener[] = []
    public callsToOff: PeripheralEventAndListener[] = []

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
        debugger
        this.numCallsToConnectAsync++
    }

    public async disconnectAsync() {
        this.numCallsToDisconnectAsync++
        this.emit('disconnect')
    }

    public async updateRssiAsync() {
        this.numCallsToUpdateRssiAsync++
    }

    public async discoverAllServicesAndCharacteristicsAsync() {
        this.numCallsToDiscoverAllServicesAndCharacteristicsAsync++
        return this.fakeServicesAndCharacteristics
    }

    public on(event: PeripheralEvent, listener: (arg: any) => void) {
        this.callsToOn.push({ event, listener })
    }

    public off(event: PeripheralEvent, listener: (arg: any) => void) {
        this.callsToOff.push({ event, listener })
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

    public emit(event: string, ...args: any[]) {
        this.callsToOn
            .filter((call) => call.event === event)
            .forEach((call) => call.listener(...args))
    }

    public resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnectAsync = 0
        this.numCallsToDisconnectAsync = 0
        this.numCallsToDiscoverAllServicesAndCharacteristicsAsync = 0
        this.numCallsToUpdateRssiAsync = 0
        this.callsToOn = []
        this.callsToOff = []
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
    off(event: string, listener: (arg?: any) => void): void
}

export interface PeripheralOptions {
    uuid?: string
    localName?: string
}

export interface PeripheralEventAndListener {
    event: PeripheralEvent
    listener: (arg?: any) => void
}

export type PeripheralEvent = 'rssiUpdate' | 'disconnect'
