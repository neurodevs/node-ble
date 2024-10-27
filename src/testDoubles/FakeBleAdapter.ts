import { BleAdapter } from '../BleAdapter'

export default class FakeBleAdapter implements BleAdapter {
    public static numCallsToConstructor = 0
    public static numCallsToConnect = 0

    public constructor() {
        FakeBleAdapter.numCallsToConstructor++
    }

    public async connect() {
        FakeBleAdapter.numCallsToConnect++
    }

    public static resetTestDouble() {
        FakeBleAdapter.numCallsToConstructor = 0
        FakeBleAdapter.numCallsToConnect = 0
    }
}
