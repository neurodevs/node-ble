import { BleConnector } from '../../components/BleDeviceConnector'
import FakeBleAdapter from '../BleAdapter/FakeBleAdapter'

export default class FakeBleConnector implements BleConnector {
    public static numCallsToConstructor = 0
    public static numCallsToConnect = 0
    public static numCallsToDisconnect = 0
    public static numCallsToGetBleAdapter = 0

    public static fakeBleAdapter = new FakeBleAdapter()

    public constructor() {
        FakeBleConnector.numCallsToConstructor++
    }

    public async connectBle() {
        FakeBleConnector.numCallsToConnect++
        return this.fakeBleAdapter
    }

    public async disconnectBle() {
        FakeBleConnector.numCallsToDisconnect++
    }

    public getBleAdapter() {
        FakeBleConnector.numCallsToGetBleAdapter++
        return this.fakeBleAdapter
    }

    public get fakeBleAdapter() {
        return FakeBleConnector.fakeBleAdapter
    }

    public static resetTestDouble() {
        FakeBleConnector.numCallsToConstructor = 0
        FakeBleConnector.numCallsToConnect = 0
        FakeBleConnector.numCallsToDisconnect = 0
        FakeBleConnector.numCallsToGetBleAdapter = 0
    }
}
