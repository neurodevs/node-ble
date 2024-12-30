import { Characteristic } from '@abandonware/noble'
import { BleAdapter } from '../../components/BleDeviceAdapter'

export default class FakeBleAdapter implements BleAdapter {
    public static numCallsToConstructor = 0
    public static numCallsToConnect = 0
    public static numCallsToDisconnect = 0
    public static callsToGetCharacteristic: string[] = []

    public static fakeCharacteristics: Record<string, Characteristic> = {}

    public constructor() {
        FakeBleAdapter.numCallsToConstructor++
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
        FakeBleAdapter.numCallsToConstructor = 0
        FakeBleAdapter.numCallsToConnect = 0
        FakeBleAdapter.numCallsToDisconnect = 0
    }
}
