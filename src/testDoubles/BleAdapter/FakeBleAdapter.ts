import { generateId } from '@sprucelabs/test-utils'
import { Characteristic } from '@abandonware/noble'
import {
    BleAdapter,
    BleAdapterConstructorOptions,
} from '../../components/BleDeviceAdapter'

export default class FakeBleAdapter implements BleAdapter {
    public static callsToConstructor: (
        | BleAdapterConstructorOptions
        | undefined
    )[] = []

    public static numCallsToConnect = 0
    public static numCallsToDisconnect = 0
    public static callsToGetCharacteristic: string[] = []

    public static fakeCharacteristics: Record<string, Characteristic> = {}

    private _uuid: string
    private _name: string

    public constructor(options?: BleAdapterConstructorOptions) {
        const { peripheral } = options ?? {}
        const { uuid, advertisement } = peripheral ?? {}
        const { localName } = advertisement ?? {}

        this._uuid = uuid ?? generateId()
        this._name = localName ?? generateId()

        FakeBleAdapter.callsToConstructor.push(options)
    }

    public async connect() {
        FakeBleAdapter.numCallsToConnect++
    }

    public async disconnect() {
        FakeBleAdapter.numCallsToDisconnect++
    }

    public getCharacteristic(uuid: string) {
        this.callsToGetCharacteristic.push(uuid)
        return this.fakeCharacteristics?.[uuid]
    }

    public get uuid() {
        return this._uuid
    }

    public get name() {
        return this._name
    }

    private get callsToGetCharacteristic() {
        return FakeBleAdapter.callsToGetCharacteristic
    }

    private get fakeCharacteristics() {
        return FakeBleAdapter.fakeCharacteristics
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnect = 0
        this.numCallsToDisconnect = 0
        this.callsToGetCharacteristic = []
    }
}

export interface CallToBleAdapterConstructor {
    options: BleAdapterConstructorOptions
}
