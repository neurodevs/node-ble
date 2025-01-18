import AbstractSpruceTest, {
    assert,
    generateId,
    test,
} from '@sprucelabs/test-utils'
import BleDeviceConnector, {
    BleConnector,
    BleConnectorOptions,
} from '../components/BleDeviceConnector'
import BleDeviceController from '../components/BleDeviceController'
import BleDeviceScanner from '../components/BleDeviceScanner'
import FakeBleController from '../testDoubles/BleController/FakeBleController'
import FakeBleScanner from '../testDoubles/BleScanner/FakeBleScanner'
import FakePeripheral from '../testDoubles/noble/FakePeripheral'

export default class BleDeviceConnectorTest extends AbstractSpruceTest {
    private static instance: BleConnector
    private static peripheral: FakePeripheral

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceScanner.Class = FakeBleScanner
        FakeBleScanner.resetTestDouble()

        this.peripheral = this.FakePeripheral()
        FakeBleScanner.fakedPeripherals = [this.peripheral]

        BleDeviceController.Class = FakeBleController
        FakeBleController.resetTestDouble()

        this.instance = await this.BleDeviceConnector()
    }

    @test()
    public static async createsBleDeviceConnectorInstance() {
        assert.isTruthy(this.instance, 'Should create an instance!')
    }

    @test()
    protected static async createsBleDeviceScanner() {
        assert.isEqual(
            FakeBleScanner.callsToConstructor.length,
            1,
            'Should create an instance of BleDeviceScanner!'
        )
    }

    @test()
    protected static async passesOptionalBleUuidToScanner() {
        assert.isEqual(
            FakeBleScanner.callsToScanForUuid[0]?.uuid,
            this.peripheral.uuid,
            'Should pass uuid to BleDeviceScanner!'
        )
    }

    @test()
    protected static async passesOptionalRssiIntervalMsToScanner() {
        assert.isEqual(
            FakeBleScanner.callsToScanForUuid[0]?.options?.rssiIntervalMs,
            this.rssiIntervalMs,
            'Should pass rssiIntervalMs to BleDeviceScanner!'
        )
    }

    @test()
    protected static async callsScanForNameIfUuidNotPassed() {
        FakeBleScanner.resetTestDouble()

        await this.BleDeviceConnector({
            deviceUuid: undefined,
        })

        const { name, options } = this.callsToScanForName[0]

        assert.isEqual(
            name,
            this.deviceLocalName,
            'Should call scanForName on BleDeviceScanner!'
        )

        const { characteristicCallbacks } = options ?? {}

        assert.isTruthy(
            characteristicCallbacks,
            'Should pass characteristicCallbacks!'
        )
    }

    @test()
    protected static async canDisableConnectBleOnCreate() {
        FakeBleController.resetTestDouble()

        await this.BleDeviceConnector({
            connectBleOnCreate: false,
        })

        assert.isEqual(
            FakeBleController.numCallsToConnect,
            0,
            'Should not connect to BleController!'
        )
    }

    @test()
    protected static async disconnectBleCallsDisconnectOnPeripheral() {
        await this.disconnectBle()

        assert.isEqual(
            FakeBleController.numCallsToDisconnect,
            1,
            'Should call disconnect on BleController!'
        )
    }

    protected static async disconnectBle() {
        await this.instance.disconnectBle()
    }

    private static get callsToScanForName() {
        return FakeBleScanner.callsToScanForName
    }

    private static readonly deviceUuid = generateId()
    private static readonly deviceLocalName = generateId()
    private static readonly rssiIntervalMs = 10

    private static readonly scanOptions = {
        characteristicCallbacks: {},
        rssiIntervalMs: BleDeviceConnectorTest.rssiIntervalMs,
    }

    private static FakePeripheral() {
        return new FakePeripheral({
            uuid: this.deviceUuid,
            localName: this.deviceLocalName,
        })
    }

    private static async BleDeviceConnector(
        options?: Partial<BleConnectorOptions>
    ) {
        return BleDeviceConnector.Create({
            scanOptions: this.scanOptions,
            deviceLocalName: this.deviceLocalName,
            deviceUuid: this.deviceUuid,
            ...options,
        })
    }
}
