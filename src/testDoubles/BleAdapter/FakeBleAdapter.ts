import { Characteristic, Peripheral } from '@abandonware/noble'
import {
    BleAdapter,
    BleAdapterOptions,
} from '../../components/BleDeviceAdapter'

export default class FakeBleAdapter implements BleAdapter {
    public static callsToConstructor: CallToBleAdapterConstructor[] = []
    public static numCallsToConnect = 0
    public static numCallsToDisconnect = 0
    public static callsToGetCharacteristic: string[] = []

    public static fakeCharacteristics: Record<string, Characteristic> = {}

    public constructor(peripheral?: Peripheral, options?: BleAdapterOptions) {
        FakeBleAdapter.callsToConstructor.push({ peripheral, options })
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
    peripheral?: Peripheral
    options?: BleAdapterOptions
}
