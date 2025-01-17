import { BleConnector } from '../../components/BleDeviceConnector'
import FakeBleAdapter from '../BleAdapter/FakeBleAdapter'

export default class FakeBleConnector implements BleConnector {
    public static numCallsToConstructor = 0
    public static numCallsToConnectBle = 0
    public static numCallsToDisconnectBle = 0
    public static numCallsToGetBleAdapter = 0

    public static fakeBleAdapter = new FakeBleAdapter()

    public constructor() {
        FakeBleConnector.numCallsToConstructor++
    }

    public async connectBle() {
        FakeBleConnector.numCallsToConnectBle++
        return this.fakeBleAdapter
    }

    public async disconnectBle() {
        FakeBleConnector.numCallsToDisconnectBle++
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
        FakeBleConnector.numCallsToConnectBle = 0
        FakeBleConnector.numCallsToDisconnectBle = 0
        FakeBleConnector.numCallsToGetBleAdapter = 0
    }
}
