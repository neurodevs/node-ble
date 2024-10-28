import AbstractSpruceTest, {
    test,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import { Peripheral } from '@abandonware/noble'
import BleAdapterImpl from '../BleAdapter'
import FakeCharacteristic from '../testDoubles/noble/FakeCharacteristic'
import FakePeripheral, {
    EventAndListener,
} from '../testDoubles/noble/FakePeripheral'
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

    @test()
    protected static async setsUpRssiUpdateHandlerWithOn() {
        const { event, listener } = this.peripheral.callsToOn[0]

        assert.isEqual(
            event,
            this.expectedRssiEvent,
            'Should have called peripheral.on("rssiUpdate", ...)!'
        )

        assert.isFunction(
            listener,
            'Should have passed a listener to peripheral.on(...)!'
        )
    }

    @test()
    protected static async rssiListenerCallsLogWithExpectedMessage() {
        this.instance.setLogInfoSpy()

        const { listener } = this.peripheral.callsToOn[0]
        const rssi = Math.random() * 100
        listener(rssi)

        const localName = this.instance.localName

        assert.isEqual(
            this.instance.infoLogs[0],
            `RSSI (${localName}): ${rssi}`,
            'Should have called log.info once!'
        )
    }

    @test()
    protected static async setsUpDisconnectHandlerWithOn() {
        const { event, listener } = this.peripheral.callsToOn[1]

        assert.isEqual(
            event,
            'disconnect',
            'Should have passed an event to peripheral.on(...)!'
        )

        assert.isFunction(
            listener,
            'Should have passed a listener to peripheral.on(...)!'
        )
    }

    @test()
    protected static async disconnectListenerCallsLogWithExpectedMessage() {
        this.instance.setLogWarnSpy()

        const { listener } = this.peripheral.callsToOn[1]
        listener()

        assert.isEqual(
            this.instance.warnLogs[0],
            `BLE disconnected from ${this.localName}!`,
            'Should have called log.warn once!'
        )
    }

    @test()
    protected static async disconnectMethodDisconnectsFromPeripheral() {
        await this.instance.disconnect()

        assert.isEqual(
            this.peripheral.numCallsToDisconnectAsync,
            1,
            'Should have called disconnectAsync on peripheral!'
        )
    }

    @test()
    protected static async doesNotLogIfDisconnectIsCalled() {
        this.instance.setLogWarnSpy()

        await this.instance.disconnect()

        assert.isLength(
            this.instance.warnLogs,
            0,
            'Should not have called log.warn!'
        )
    }

    @test()
    protected static async connectResetsIntentionalDisconnectFlag() {
        await this.instance.disconnect()

        assert.isTrue(
            this.instance.getIsIntentionalDisconnect(),
            'Should have set isIntentionalDisconnect to true!'
        )

        await this.connect()

        assert.isFalse(
            this.instance.getIsIntentionalDisconnect(),
            'Should have set isIntentionalDisconnect to false!'
        )
    }

    @test('does not call disconnectAsync when disconnecting', 'disconnecting')
    @test('does not call disconnectAsync when disconnected', 'disconnected')
    protected static async doesNotCallDisconnectInState(
        state: 'disconnected' | 'disconnecting'
    ) {
        this.instance.setState(state)

        await this.instance.disconnect()

        assert.isEqual(
            this.peripheral.numCallsToDisconnectAsync,
            0,
            'Should not have called disconnectAsync on peripheral!'
        )
    }

    @test()
    protected static async throwsIfDisconnectAsyncFails() {
        const originalError = 'Failed to disconnect!'

        this.peripheral.disconnectAsync = async () => {
            throw new Error(originalError)
        }

        const err = await assert.doesThrowAsync(async () => {
            await this.instance.disconnect()
        })

        errorAssert.assertError(err, 'DEVICE_DISCONNECT_FAILED', {
            localName: this.localName,
            originalError,
        })
    }

    @test()
    protected static async disconnectTurnsOffRssiUpdateHandler() {
        await this.instance.disconnect()

        assert.isEqual(
            this.peripheral.callsToOff[0].event,
            this.expectedRssiEvent,
            'Should have turned off rssiUpdate handler!'
        )

        assert.isFunction(
            this.peripheral.callsToOff[0].listener,
            'Should have passed the listener to peripheral.off(...)!'
        )
    }

    @test()
    protected static async disconnectTurnsOffDisconnectHandler() {
        await this.instance.disconnect()

        assert.isEqual(
            this.peripheral.callsToOff[1].event,
            'disconnect',
            'Should have turned off disconnect handler!'
        )

        assert.isFunction(
            this.peripheral.callsToOff[1].listener,
            'Should have passed the listener to peripheral.off(...)!'
        )
    }

    private static get expectedRssiOptions() {
        return {
            event: this.rssiUpdateEvent,
            listener: this.fakedListener,
        } as EventAndListener
    }

    private static get expectedRssiEvent() {
        return this.expectedRssiOptions.event
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
        return this.peripheral.numCallsToConnectAsync
    }

    private static get advertisement() {
        return this.peripheral.advertisement
    }

    private static get localName() {
        return this.advertisement.localName
    }

    private static readonly fakedListener = () => {}

    private static readonly rssiUpdateEvent = 'rssiUpdate'

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
