import { Characteristic } from '@abandonware/noble'
import {
    BleAdapter,
    BleAdapterConstructorOptions,
} from '../../components/BleDeviceAdapter'

export default class FakeBleAdapter implements BleAdapter {
    public static callsToConstructor: BleAdapterConstructorOptions[] = []
    public static numCallsToConnect = 0
    public static numCallsToDisconnect = 0
    public static callsToGetCharacteristic: string[] = []

    public static fakeCharacteristics: Record<string, Characteristic> = {}

    public constructor(options: BleAdapterConstructorOptions) {
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
