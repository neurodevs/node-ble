import { BleAdapter } from '../components/BleAdapter'

export default class FakeBleAdapter implements BleAdapter {
    public static numCallsToConstructor = 0
    public static numCallsToConnect = 0
    public static numCallsToDisconnect = 0

    public constructor() {
        FakeBleAdapter.numCallsToConstructor++
    }

    public async connect() {
        FakeBleAdapter.numCallsToConnect++
    }

    public async disconnect() {
        FakeBleAdapter.numCallsToDisconnect++
    }

    public static resetTestDouble() {
        FakeBleAdapter.numCallsToConstructor = 0
        FakeBleAdapter.numCallsToConnect = 0
        FakeBleAdapter.numCallsToDisconnect = 0
    }
}
