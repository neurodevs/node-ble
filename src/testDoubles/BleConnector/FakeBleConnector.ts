import { BleConnector } from '../../modules/BleDeviceConnector'
import FakeBleController from '../BleController/FakeBleController'

export default class FakeBleConnector implements BleConnector {
    public static numCallsToConstructor = 0
    public static numCallsToConnectBle = 0
    public static numCallsToDisconnectBle = 0
    public static numCallsToGetBleController = 0

    public static fakeBleController = new FakeBleController()

    public constructor() {
        FakeBleConnector.numCallsToConstructor++
    }

    public async connectBle() {
        FakeBleConnector.numCallsToConnectBle++
        return this.fakeBleController
    }

    public async disconnectBle() {
        FakeBleConnector.numCallsToDisconnectBle++
    }

    public getBleController() {
        FakeBleConnector.numCallsToGetBleController++
        return this.fakeBleController
    }

    public get fakeBleController() {
        return FakeBleConnector.fakeBleController
    }

    public static resetTestDouble() {
        FakeBleConnector.numCallsToConstructor = 0
        FakeBleConnector.numCallsToConnectBle = 0
        FakeBleConnector.numCallsToDisconnectBle = 0
        FakeBleConnector.numCallsToGetBleController = 0
    }
}
