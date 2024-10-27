import AbstractSpruceTest, {
    test,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import { Peripheral } from '@abandonware/noble'
import BleAdapterImpl from '../BleAdapter'
import FakeCharacteristic from '../testDoubles/noble/FakeCharacteristic'
import FakePeripheral from '../testDoubles/noble/FakePeripheral'
import SpyBleAdapter from '../testDoubles/SpyBleAdapter'

export default class BleAdapterTest extends AbstractSpruceTest {
    private static instance: SpyBleAdapter
    private static uuid: string

    protected static async beforeEach() {
        await super.beforeEach()

        this.uuid = generateId()

        BleAdapterImpl.Class = SpyBleAdapter

        this.instance = await this.BleAdapter(this.uuid)
    }

    @test()
    protected static async canCreateBleAdapter() {
        assert.isTruthy(this.instance, 'Should have created a BleAdapter!')
    }

    @test()
    protected static async throwsWithMissingRequiredOptions() {
        const err = await assert.doesThrowAsync(async () => {
            // @ts-ignore
            await BleAdapterImpl.Create()
        })
        errorAssert.assertError(err, 'MISSING_PARAMETERS', {
            parameters: ['peripheral'],
        })
    }

    @test()
    protected static async connectsToPeripheralDuringCreate() {
        assert.isTruthy(
            this.didCallConnectAsync,
            'Should connect to peripheral during Create!'
        )
    }

    @test()
    protected static async callsPeripheralDiscoverAllCharacteristicsAndServicesAsync() {
        assert.isEqual(
            this.numCallsToDiscoverAllServicesAndCharacteristicsAsync,
            1,
            'Should have called discoverAllCharacteristicsAndServicesAsync on peripheral!'
        )
    }

    @test()
    protected static async automaticallySubscribesToCharacteristics() {
        assert.isEqual(
            this.characteristics.length,
            0,
            'Should not have any characteristics yet!'
        )

        const uuid1 = generateId()
        const uuid2 = generateId()

        const c1 = this.FakeCharacteristic(uuid1)
        const c2 = this.FakeCharacteristic(uuid2)
        this.setFakeCharacteristics([c1, c2])

        await this.connect()

        assert.isEqual(
            c1.numCallsToSubscribeAsync,
            1,
            'Should have subscribed to first characteristic!'
        )

        assert.isEqual(
            c2.numCallsToSubscribeAsync,
            1,
            'Should have subscribed to second characteristic!'
        )
    }

    @test()
    protected static async doesNotSubscribeToCharacteristicWithoutNotifyProperty() {
        const uuid = generateId()

        const characteristic = this.FakeCharacteristic(uuid, [])
        this.setFakeCharacteristics([characteristic])

        characteristic.subscribeAsync = async () => {
            characteristic.numCallsToSubscribeAsync++
        }

        await this.connect()

        assert.isEqual(
            characteristic.numCallsToSubscribeAsync,
            0,
            'Should not have subscribed to characteristic!'
        )
    }

    @test()
    protected static async throwsIfFailsToSubscribeToCharacteristic() {
        const uuid = generateId()

        this.createAndFakeThrowCharacteristic(uuid)

        const err = await assert.doesThrowAsync(async () => {
            await this.connect()
        })

        errorAssert.assertError(err, 'CHARACTERISTIC_SUBSCRIBE_FAILED', {
            characteristicUuid: uuid,
        })
    }

    private static createAndFakeThrowCharacteristic(uuid: string) {
        const characteristic = this.FakeCharacteristic(uuid)

        characteristic.subscribeAsync = async () => {
            throw new Error('Failed to subscribe!')
        }

        this.setFakeCharacteristics([characteristic])

        return characteristic
    }

    private static async connect() {
        await this.instance.connect()
    }

    private static get peripheral() {
        return this.instance.getPeripheral() as unknown as FakePeripheral
    }

    private static get numCallsToDiscoverAllServicesAndCharacteristicsAsync() {
        return this.peripheral
            .numCallsToDiscoverAllServicesAndCharacteristicsAsync
    }

    private static get characteristics() {
        return this.instance.getCharacteristics()
    }

    private static get didCallConnectAsync() {
        return this.peripheral.didCallConnectAsync
    }

    private static setFakeCharacteristics(fakes: FakeCharacteristic[]) {
        this.peripheral.setFakeCharacteristics(fakes)
    }

    private static FakeCharacteristic(uuid: string, properties?: string[]) {
        return new FakeCharacteristic({ uuid, properties })
    }

    private static FakePeripheral(uuid: string) {
        return new FakePeripheral({ uuid }) as unknown as Peripheral
    }

    private static async BleAdapter(uuid: string) {
        const peripheral = this.FakePeripheral(uuid)
        const instance = await BleAdapterImpl.Create(peripheral)
        return instance as SpyBleAdapter
    }
}
