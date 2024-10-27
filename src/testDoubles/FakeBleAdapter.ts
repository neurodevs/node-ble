import { BleAdapter } from '../BleAdapter'

export default class FakeBleAdapter implements BleAdapter {
    public static numCallsToConstructor = 0

    public constructor() {
        FakeBleAdapter.numCallsToConstructor++
    }

    public static resetTestDouble() {
        FakeBleAdapter.numCallsToConstructor = 0
    }
}
