import AbstractSpruceTest, {
    test,
    assert,
    generateId,
} from '@sprucelabs/test-utils'
import { Characteristic, Peripheral } from '@abandonware/noble'
import BleDeviceController, {
    BleControllerOptions,
} from '../modules/BleDeviceController'
import SpyBleController from '../testDoubles/BleController/SpyBleController'
import FakeCharacteristic from '../testDoubles/noble/FakeCharacteristic'
import FakePeripheral, {
    PeripheralEventAndListener,
} from '../testDoubles/noble/FakePeripheral'

export default class BleDeviceControllerTest extends AbstractSpruceTest {
    private static instance: SpyBleController
    private static peripheral: FakePeripheral
    private static uuid: string

    protected static async beforeEach() {
        await super.beforeEach()

        this.uuid = generateId()

        BleDeviceController.Class = SpyBleController

        this.peripheral = this.FakePeripheral(this.uuid)

        this.instance = await this.BleController()
    }

    @test()
    protected static async canCreateBleDeviceController() {
        assert.isTruthy(this.instance, 'Should have created a BleController!')
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
        const charUuid = generateId()

        this.createAndFakeThrowCharacteristic(charUuid)

        const err = await assert.doesThrowAsync(async () => {
            await this.connect()
        })

        assert.isEqual(
            err.message,
            this.generateSubscribeFailedMessage(charUuid),
            'Did not receive the expected error!'
        )
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
        this.peripheral.disconnectAsync = async () => {
            throw new Error(this.fakeErrorMessage)
        }

        const err = await assert.doesThrowAsync(async () => {
            await this.instance.disconnect()
        })

        assert.isEqual(
            err.message,
            this.disconnectFailedMessage,
            'Did not receive the expected error!'
        )
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
        this.peripheral.resetTestDouble()

        const instance = await this.BleController({
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
            this.callsToOff.length,
            2,
            'Should have called peripheral.off(...) twice!'
        )
    }

    @test('sets rssi interval thrice', 3)
    @test('sets rssi interval twice', 2)
    @test('sets rssi interval once', 1)
    protected static async setsIntervalForRssi(numIntervals: number) {
        await this.createControllerAndRunRssiFor(numIntervals)

        assert.isEqual(
            this.peripheral.numCallsToUpdateRssiAsync,
            numIntervals,
            'Should have called updateRssiAsync on peripheral!'
        )
    }

    @test()
    protected static async clearsRssiIntervalOnDisconnect() {
        const controller = await this.createControllerAndRunRssiFor(1)
        await controller.disconnect()

        await this.wait(this.rssiIntervalMs * 1.2)

        assert.isEqual(
            this.peripheral.numCallsToUpdateRssiAsync,
            1,
            'Should have cleared the rssi interval!'
        )
    }

    @test()
    protected static async hasOptionToEnableRssi() {
        await this.createControllerAndRunRssiFor(1)

        assert.isEqual(
            this.peripheral.numCallsToUpdateRssiAsync,
            1,
            'Should have called updateRssiAsync on peripheral!'
        )
    }

    @test()
    protected static async callsProvidedCharacteristicCallbacks() {
        const { peripheral, characteristic } =
            this.createPeripheralWithCharacteristic()

        let wasHit = false

        const characteristicCallbacks = {
            [characteristic.uuid]: () => {
                wasHit = true
            },
        }

        await BleDeviceController.Create({
            peripheral: peripheral as any,
            characteristicCallbacks,
        })

        characteristic.simulateDataReceived(Buffer.from([1, 2, 3]))

        const call = characteristic.callsToOn[0]
        call.listener(Buffer.from([1, 2, 3]), characteristic as any)

        assert.isEqual(call.event, 'data', 'Should have called on("data")!')
        assert.isTrue(wasHit, 'Should have called the characteristic callback!')
    }

    @test()
    protected static async canGetCharacteristicByUuid() {
        const { peripheral, characteristic } =
            this.createPeripheralWithCharacteristic()

        const controller = await BleDeviceController.Create({
            peripheral: peripheral as any,
            characteristicCallbacks: {
                [characteristic.uuid]: () => {},
            },
        })

        const actual = controller.getCharacteristic(characteristic.uuid)

        assert.isEqualDeep(
            actual,
            characteristic as unknown as Characteristic,
            'Should have returned characteristic!'
        )
    }

    @test()
    protected static async exposesPeripheralUuidField() {
        assert.isEqual(
            this.instance.uuid,
            this.uuid,
            'Should have exposed peripheral uuid!'
        )
    }

    @test()
    protected static async exposesPeripheralNameField() {
        assert.isEqual(
            this.instance.name,
            this.localName,
            'Should have exposed peripheral name!'
        )
    }

    private static createPeripheralWithCharacteristic() {
        const characteristicUuid = generateId()

        const characteristic = new FakeCharacteristic({
            uuid: characteristicUuid,
        })

        const peripheral = new FakePeripheral()
        peripheral.setFakeCharacteristics([characteristic])

        return { peripheral, characteristic }
    }

    private static async createControllerAndRunRssiFor(numIntervals: number) {
        this.peripheral.resetTestDouble()

        const promise = this.BleController({
            rssiIntervalMs: this.rssiIntervalMs,
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
            throw new Error(this.fakeErrorMessage)
        }

        this.setFakeCharacteristics([characteristic])

        return characteristic
    }

    private static async connect() {
        await this.instance.connect()
    }

    private static generateSubscribeFailedMessage(charUuid: string) {
        return `
            \n Failed to subscribe to characteristicUuid: ${charUuid}!
            \n Error: ${this.fakeErrorMessage}
        `
    }

    private static get disconnectFailedMessage() {
        return `
            \n Failed to disconnect from peripheral: ${this.localName}!
            \n Error: ${this.fakeErrorMessage}
        `
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
    private static readonly rssiIntervalMs = 10
    private static readonly fakeErrorMessage = 'Failed to subscribe!'

    private static setFakeCharacteristics(fakes: FakeCharacteristic[]) {
        this.peripheral.setFakeCharacteristics(fakes)
    }

    private static FakeCharacteristic(uuid: string, properties?: string[]) {
        return new FakeCharacteristic({ uuid, properties })
    }

    private static FakePeripheral(uuid: string) {
        return new FakePeripheral({ uuid })
    }

    private static async BleController(
        options?: Partial<BleControllerOptions>
    ) {
        return (await BleDeviceController.Create({
            peripheral: this.peripheral as unknown as Peripheral,
            characteristicCallbacks: {},
            ...options,
        })) as SpyBleController
    }
}
