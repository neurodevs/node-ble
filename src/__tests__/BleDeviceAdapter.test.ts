import AbstractSpruceTest, {
    test,
    assert,
    errorAssert,
    generateId,
} from '@sprucelabs/test-utils'
import { Peripheral } from '@abandonware/noble'
import BleDeviceAdapter, {
    BleAdapterOptions,
} from '../components/BleDeviceAdapter'
import SpyBleAdapter from '../testDoubles/BleAdapter/SpyBleAdapter'
import FakeCharacteristic from '../testDoubles/noble/FakeCharacteristic'
import FakePeripheral, {
    PeripheralEventAndListener,
} from '../testDoubles/noble/FakePeripheral'

export default class BleDeviceAdapterTest extends AbstractSpruceTest {
    private static instance: SpyBleAdapter
    private static uuid: string

    protected static async beforeEach() {
        await super.beforeEach()

        this.uuid = generateId()

        BleDeviceAdapter.Class = SpyBleAdapter

        this.instance = await this.BleAdapter(this.uuid)
    }

    @test()
    protected static async canCreateBleDeviceAdapter() {
        assert.isTruthy(this.instance, 'Should have created a BleAdapter!')
    }

    @test()
    protected static async throwsWithMissingRequiredOptions() {
        const err = await assert.doesThrowAsync(async () => {
            // @ts-ignore
            await BleDeviceAdapter.Create()
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
        const { event, listener } = this.callsToOn[0]

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

        const { listener } = this.callsToOn[0]
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
        const { event, listener } = this.callsToOn[1]

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

        const { listener } = this.callsToOn[1]
        listener()

        assert.isEqual(
            this.instance.warnLogs[0],
            `Unexpectedly disconnected from ${this.localName}!`,
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

    @test()
    protected static async providesOptionToDisableAutoConnect() {
        const instance = await this.BleAdapter(this.uuid, {
            shouldConnect: false,
        })

        const peripheral = instance.getPeripheral() as unknown as FakePeripheral

        assert.isEqual(
            peripheral.numCallsToConnectAsync,
            0,
            'Should not have connected to peripheral!'
        )
    }

    @test()
    protected static async automaticallyReconnectsFromUnintentionalDisconnect() {
        this.peripheral.emit('disconnect')

        assert.isEqual(
            this.didCallConnectAsync,
            2,
            'Should have called connectAsync twice!'
        )
    }

    @test()
    protected static async reconnectAddsInfoLog() {
        this.instance.setLogInfoSpy()

        this.peripheral.emit('disconnect')

        assert.isEqual(
            this.instance.infoLogs[0],
            `Reconnecting to ${this.localName}...`,
            'Should have logged a reconnect message!'
        )
    }

    @test()
    protected static async shouldTeardownInitialHandlersOnReconnect() {
        this.peripheral.emit('disconnect')

        assert.isEqual(
            BleDeviceAdapterTest.callsToOff.length,
            2,
            'Should have called peripheral.off(...) twice!'
        )
    }

    @test()
    protected static async setsTenSecondIntervalDefaultForRssiUpdate() {
        assert.isEqual(
            this.instance.getRssiIntervalMs(),
            this.defaultRssiIntervalMs,
            'Should set an interval for 10 seconds!'
        )
    }

    @test('sets rssi interval thrice', 3)
    @test('sets rssi interval twice', 2)
    @test('sets rssi interval once', 1)
    protected static async setsIntervalForRssi(numIntervals: number) {
        await this.createAdapterAndRunFor(numIntervals)

        assert.isEqual(
            this.peripheral.numCallsToUpdateRssiAsync,
            numIntervals,
            'Should have called updateRssiAsync on peripheral!'
        )
    }

    @test()
    protected static async clearsRssiIntervalOnDisconnect() {
        const adapter = await this.createAdapterAndRunFor(1)
        await adapter.disconnect()

        await this.wait(this.rssiIntervalMs * 1.2)

        assert.isEqual(
            this.peripheral.numCallsToUpdateRssiAsync,
            1,
            'Should have cleared the rssi interval!'
        )
    }

    @test()
    protected static async hasOptionToDisableRssiUpdate() {
        await this.createAdapterAndRunFor(1, {
            shouldUpdateRssi: false,
        })

        assert.isEqual(
            this.peripheral.numCallsToUpdateRssiAsync,
            0,
            'Should not have called updateRssiAsync on peripheral!'
        )
    }

    @test()
    protected static async callsProvidedCharacteristicCallbacks() {
        const characteristicUuid = generateId()

        const characteristic = new FakeCharacteristic({
            uuid: characteristicUuid,
        })

        const peripheral = new FakePeripheral()
        peripheral.setFakeCharacteristics([characteristic])

        const characteristicCallbacks = {
            [characteristicUuid]: () => {},
        }

        await BleDeviceAdapter.Create(peripheral as unknown as Peripheral, {
            characteristicCallbacks,
        })

        assert.isEqualDeep(characteristic.callsToOn[0], {
            event: 'data',
            listener: characteristicCallbacks[characteristicUuid],
        })
    }

    private static async createAdapterAndRunFor(
        numIntervals: number,
        options?: BleAdapterOptions
    ) {
        this.peripheral.resetTestDouble()

        const promise = BleDeviceAdapter.Create(this.peripheral as any, {
            rssiIntervalMs: this.rssiIntervalMs,
            ...options,
        })

        await this.wait(this.rssiIntervalMs * (numIntervals + 0.3))

        return promise
    }

    private static get expectedRssiOptions() {
        return {
            event: this.rssiUpdateEvent,
            listener: this.fakedListener,
        } as PeripheralEventAndListener
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

    private static get callsToOn() {
        return this.peripheral.callsToOn
    }

    private static get callsToOff() {
        return this.peripheral.callsToOff
    }

    private static get advertisement() {
        return this.peripheral.advertisement
    }

    private static get localName() {
        return this.advertisement.localName
    }

    private static readonly fakedListener = () => {}

    private static readonly rssiUpdateEvent = 'rssiUpdate'

    private static readonly defaultRssiIntervalMs = 10000

    private static readonly rssiIntervalMs = 10

    private static setFakeCharacteristics(fakes: FakeCharacteristic[]) {
        this.peripheral.setFakeCharacteristics(fakes)
    }

    private static FakeCharacteristic(uuid: string, properties?: string[]) {
        return new FakeCharacteristic({ uuid, properties })
    }

    private static FakePeripheral(uuid: string) {
        return new FakePeripheral({ uuid }) as unknown as Peripheral
    }

    private static async BleAdapter(
        uuid?: string,
        options?: BleAdapterOptions
    ) {
        const peripheral = this.FakePeripheral(uuid ?? generateId())
        const instance = await BleDeviceAdapter.Create(peripheral, options)
        return instance as SpyBleAdapter
    }
}
