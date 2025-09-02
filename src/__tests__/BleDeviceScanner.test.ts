import AbstractSpruceTest, {
    test,
    assert,
    generateId,
    errorAssert,
} from '@sprucelabs/test-utils'
import noble, { Peripheral } from '@abandonware/noble'
import BleDeviceController, {
    BleController,
} from '../modules/BleDeviceController'
import BleDeviceScanner, {
    BleScannerOptions,
    ScanOptions,
} from '../modules/BleDeviceScanner'
import SpyBleController from '../testDoubles/BleController/SpyBleController'
import SpyBleScanner from '../testDoubles/BleScanner/SpyBleScanner'
import FakeCharacteristic, {
    CharacteristicOptions,
} from '../testDoubles/noble/FakeCharacteristic'
import FakeNoble, { CreateFakePeripheral } from '../testDoubles/noble/FakeNoble'
import FakePeripheral from '../testDoubles/noble/FakePeripheral'

export default class BleDeviceScannerTest extends AbstractSpruceTest {
    private static instance: SpyBleScanner
    private static noble: FakeNoble
    private static uuid: string

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceController.Class = SpyBleController
        BleDeviceScanner.Class = SpyBleScanner

        this.uuid = generateId()
        this.setupFakeNoble()

        this.instance = this.BleScanner()
    }

    @test()
    protected static async canCreateBleDeviceScanner() {
        assert.isTruthy(this.instance, 'Should have created an instance!')
    }

    @test()
    protected static async createSetsUpOnDiscoverForNoble() {
        const { eventName, listener } = this.noble.callsToOn[0]

        assert.isEqual(
            eventName,
            'discover',
            'BleScanner should have called noble.on("discover", ...)!'
        )

        assert.isFunction(
            listener,
            'BleScanner should have passed a function to noble.on(...)!'
        )
    }

    @test()
    protected static async scanSetsIsScanningTrue() {
        assert.isFalse(
            this.instance.getIsScanning(),
            'noble.isScanning should be false before calling scan!'
        )

        const promise = this.scanForUuids(['invalid-uuid'])
        await this.wait(1)

        assert.isTrue(
            this.instance.getIsScanning(),
            'scan should set noble.isScanning to true!'
        )

        await promise.catch(() => {})
    }

    @test()
    protected static async scanCallsStartScanningAsync() {
        await this.scanForUuids()

        const { uuids, allowDuplicates } =
            this.noble.callsToStartScanningAsync[0]

        assert.isEqualDeep(
            uuids,
            [],
            'scan should pass an empty array to noble.startScanningAsync!'
        )

        assert.isEqual(
            allowDuplicates,
            false,
            'scan should pass false for allowDuplicates to noble.startScanningAsync!'
        )
    }

    @test()
    protected static async scanSetsIsScanningFalseOnceAllUuidsFound() {
        await this.scanForUuids()

        assert.isFalse(
            this.instance.getIsScanning(),
            'scan should set noble.isScanning to false once all uuids are found!'
        )
    }

    @test()
    protected static async scanForUuidsReturnsControllers() {
        const controllers = await this.scanForUuids()
        const mapped = await this.mapPeripheralsToControllers()

        assert.isEqualDeep(
            this.removeLogFromEachController(controllers),
            this.removeLogFromEachController(mapped),
            'scan should return the faked peripherals!\n'
        )
    }

    @test()
    protected static async scanCallsStopScanningWhenDone() {
        await this.scanForUuids()

        assert.isEqual(
            this.noble.numCallsToStopScanningAsync,
            1,
            'scan should call noble.stopScanningAsync once all uuids are found!'
        )
    }

    @test()
    protected static async scanForPeripheralTakesUuidAndReturnsPeripheral() {
        const peripheral = await this.scanForUuid(this.uuid)

        assert.isFalse(
            peripheral instanceof Array,
            'scan should return a single peripheral when passed a string uuid!'
        )
    }

    @test()
    protected static async throwsIfScanTimesOut() {
        const invalidUuid = generateId()

        const err = await assert.doesThrowAsync(
            async () => await this.scanForUuid(invalidUuid)
        )

        errorAssert.assertError(err, 'SCAN_TIMED_OUT', {
            uuids: [invalidUuid],
            timeoutMs: this.timeoutMs,
        })
    }

    @test()
    protected static async throwsIfScanTimesOutWithName() {
        const invalidName = generateId()

        const err = await assert.doesThrowAsync(
            async () => await this.scanForName(invalidName)
        )

        errorAssert.assertError(err, 'SCAN_TIMED_OUT', {
            names: [invalidName],
        })
    }

    @test()
    protected static async createAcceptsOptionalDefaultTimeoutMs() {
        const instance = this.BleScanner({ defaultTimeoutMs: this.timeoutMs })
        const timeoutMs = instance.getTimeoutMs()
        assert.isEqual(timeoutMs, this.timeoutMs)
    }

    @test()
    protected static async canStopScanningEarly() {
        void this.scanForUuids()
        await this.wait(1)

        await this.stopScanning()

        assert.isFalse(
            this.instance.getIsScanning(),
            'stopScanning should set noble.isScanning to false!'
        )
    }

    @test()
    protected static async callingTwiceClearsPeripherals() {
        await this.scanForUuids()
        const controllers = await this.scanForUuids()
        assert.isEqual(controllers.length, 1, 'Should have found 1 controller!')
    }

    @test()
    protected static async canScanForPeripheralByName() {
        this.clearNoble()

        const name = generateId()
        this.fakePeripherals([{ name }])

        const controller = await this.scanForName(name)

        assert.isEqual(
            controller.constructor.name,
            this.expectedConstructorName,
            'scan should return the faked peripherals!'
        )
    }

    @test()
    protected static async canScanByNames() {
        this.clearNoble()

        const name = generateId()
        this.fakePeripherals([{ name }])

        const controllers = await this.scanForNames([name])

        assert.isLength(controllers, 1, 'Should return one controller!')
    }

    @test()
    protected static async scanForNamesWorksWithTwoPeripherals() {
        this.noble.clearTestDouble()

        const name1 = generateId()
        const name2 = generateId()
        this.fakePeripherals([{ name: name1 }, { name: name2 }])

        const controllers = await this.scanForNames([name1, name2])

        assert.isLength(controllers, 2)
    }

    @test()
    protected static async scanAllReturnsOnePeripheral() {
        const peripherals = await this.scanAll()

        assert.isEqualDeep(
            peripherals,
            this.fakedPeripherals,
            'scanAll should return all faked peripherals!'
        )
    }

    @test()
    protected static async scanAllReturnsTwoPeripherals() {
        this.noble.clearTestDouble()

        const uuid1 = generateId()
        const uuid2 = generateId()
        this.fakePeripherals([{ uuid: uuid1 }, { uuid: uuid2 }])

        const peripherals = await this.scanAll()

        assert.isEqualDeep(peripherals, this.fakedPeripherals)
    }

    @test()
    protected static async scanAllClearsUuidsFromPreviousRuns() {
        await this.scanForUuidsThenVoidScanAll()

        assert.isEqual(
            this.instance.getUuids().length,
            0,
            'scanAll should clear uuids from previous runs!'
        )
    }

    @test()
    protected static async scanAllClearsPeripheralsFromPreviousRuns() {
        await this.scanForUuidsThenVoidScanAll()

        assert.isEqual(
            this.instance.getPeripherals().length,
            1,
            'scanAll should clear uuids from previous runs!'
        )
    }

    @test()
    protected static async scanAllSetsIsScanningTrue() {
        this.fakeStopScanning()

        void this.scanAll()
        await this.wait(1)

        assert.isTrue(
            this.instance.getIsScanning(),
            'scanAll should set isScanning to true!'
        )
    }

    @test()
    protected static async scanAllReturnsAfterGivenTimeIfPeripheralNotFound() {
        this.clearNoble()

        await this.scanAll()

        assert.isFalse(
            this.instance.getIsScanning(),
            'scanAll should set isScanning to false when done!'
        )
    }

    @test()
    protected static async scanForNamesClearsUuidsFromPreviousRuns() {
        await this.scanForUuidsThenVoidScanForNames()

        assert.isEqual(
            this.instance.getUuids().length,
            0,
            'scanAll should clear uuids from previous runs!'
        )
    }

    @test()
    protected static async scanForNamesClearsPeripheralsFromPreviousRuns() {
        await this.scanForUuidsThenVoidScanForNames()

        assert.isEqual(
            this.instance.getPeripherals().length,
            1,
            'scanAll should clear uuids from previous runs!'
        )
    }

    @test()
    protected static async returnsBleControllerWithPeripheral() {
        const result = await this.clearFakeOneScanForUuids()

        assert.isEqual(
            result[0].constructor.name,
            this.expectedConstructorName,
            'Create should return a BleController instance!'
        )
    }

    @test()
    protected static async scanForUuidReturnsBleController() {
        const controller = await this.scanForUuid()

        assert.isEqual(
            controller.constructor.name,
            this.expectedConstructorName,
            'scanForUuid should return a BleController instance!'
        )
    }

    @test()
    protected static async scanForNamesReturnsOnceAllNamesFound() {
        this.clearNoble()
        const name = generateId()
        this.fakePeripherals([{ name }])

        const timeoutMs = 10
        const startMs = Date.now()

        await this.scanForNames([name], {
            timeoutMs,
        })

        const endMs = Date.now()
        const totalMs = endMs - startMs

        assert.isBelow(
            totalMs,
            timeoutMs,
            'Total time must be less than timeoutMs!'
        )

        await this.wait(1)

        assert.isFalse(
            this.instance.getIsScanning(),
            'scanForNames should set isScanning to false when done!'
        )
    }

    @test()
    protected static async findsByLocalNameIfPartialProvided() {
        this.clearNoble()

        const name = generateId()
        this.fakePeripherals([{ name }])

        const controller = await this.scanForName(name.slice(0, 3))

        assert.isEqual(
            controller.constructor.name,
            this.expectedConstructorName,
            'scanForName should return a BleController instance!'
        )
    }

    @test()
    protected static async addingPeripheralWithUndefinedLocalNameDoesNotThrow() {
        const validPeripheral = this.FakePeripheral()
        const invalidPeripheral = this.FakePeripheral()

        // @ts-ignore
        invalidPeripheral.advertisement.localName = undefined

        this.noble.fakedPeripherals = [validPeripheral, invalidPeripheral]

        const instance = BleDeviceScanner.Create()

        const validName = validPeripheral.advertisement.localName
        await instance.scanForName(validName, {
            ...this.defaultScanOptions,
            timeoutMs: 10,
        })
    }

    @test()
    protected static async passesCharacteristicCallbacksToController() {
        BleDeviceController.Class = SpyBleController

        const peripheral = this.FakePeripheral()

        const uuid1 = generateId()
        const uuid2 = generateId()

        const fake1 = this.FakeCharacteristic({ uuid: uuid1 })
        const fake2 = this.FakeCharacteristic({ uuid: uuid2 })

        peripheral.setFakeCharacteristics([fake1, fake2])

        this.noble.fakedPeripherals = [peripheral]

        const characteristicCallbacks = {
            [uuid1]: () => {},
            [uuid2]: () => {},
        }

        const controller = (await this.instance.scanForUuid(peripheral.uuid, {
            characteristicCallbacks,
        })) as SpyBleController

        assert.isEqualDeep(
            controller.getCharacteristicCallbacks(),
            characteristicCallbacks,
            'Should have passed fake1 to controller!'
        )
    }

    @test()
    protected static async passesOptionalRssiIntervalMsToBleController() {
        const peripheral = this.FakePeripheral()
        this.noble.fakedPeripherals = [peripheral]

        const rssiIntervalMs = 10

        const controller = (await this.instance.scanForUuid(peripheral.uuid, {
            ...this.defaultScanOptions,
            rssiIntervalMs,
        })) as SpyBleController

        const actualRssi = controller.getRssiIntervalMs()

        assert.isEqual(
            actualRssi,
            rssiIntervalMs,
            'Should have passed rssiIntervalMs to controller!'
        )
    }

    private static async mapPeripheralsToControllers() {
        return await Promise.all(
            this.peripherals.map((peripheral) =>
                this.BleController(peripheral as unknown as Peripheral)
            )
        )
    }

    private static fakeStopScanning() {
        this.instance.stopScanning = async () => {}
    }

    private static async scanForUuidsThenVoidScanAll() {
        await this.clearFakeOneScanForUuids()

        void this.scanAll()
    }

    private static async scanForUuidsThenVoidScanForNames() {
        await this.clearFakeOneScanForUuids()

        const name = this.fakedPeripherals[0].advertisement.localName
        await this.scanForNames([name])
    }

    private static async clearFakeOneScanForUuids() {
        const uuids = this.clearNobleAndFakeOnePeripheral()
        return await this.scanForUuids(uuids)
    }

    private static clearNobleAndFakeOnePeripheral() {
        this.clearNoble()
        const uuid = generateId()
        this.fakePeripherals([{ uuid }])
        return [uuid]
    }

    private static clearNoble() {
        this.noble.clearTestDouble()
    }

    private static setupFakeNoble() {
        this.noble = this.FakeNoble()
        this.fakePeripherals()
        BleDeviceScanner.noble = this.noble as unknown as typeof noble
    }

    private static fakePeripherals(fakes?: CreateFakePeripheral[]) {
        this.noble.fakePeripherals(fakes ?? [{ uuid: this.uuid }])
    }

    private static async scanAll(durationMs?: number) {
        return (await this.instance.scanAll(
            durationMs
        )) as unknown as FakePeripheral[]
    }

    private static get defaultScanOptions() {
        return {
            characteristicCallbacks: {},
            timeoutMs: this.timeoutMs,
        } as ScanOptions
    }

    private static async scanForUuid(
        uuid = this.uuid,
        options?: PartialOptions
    ) {
        return await this.instance.scanForUuid(uuid, {
            ...this.defaultScanOptions,
            ...options,
        })
    }

    private static async scanForUuids(
        uuids = this.uuids,
        options?: PartialOptions
    ) {
        return await this.instance.scanForUuids(uuids, {
            ...this.defaultScanOptions,
            ...options,
        })
    }

    private static async scanForName(name: string, options?: PartialOptions) {
        return await this.instance.scanForName(name, {
            ...this.defaultScanOptions,
            ...options,
        })
    }

    private static async scanForNames(
        names: string[],
        options?: PartialOptions
    ) {
        return await this.instance.scanForNames(names, {
            ...this.defaultScanOptions,
            ...options,
        })
    }

    private static async stopScanning() {
        await this.instance.stopScanning()
    }

    private static removeLogFromEachController(controllers: BleController[]) {
        return controllers.map((controller: any) => delete controller.log)
    }

    private static get peripherals() {
        return this.instance.getPeripherals() as unknown as FakePeripheral[]
    }

    private static get uuids() {
        return [this.uuid]
    }

    private static get fakedPeripherals() {
        return this.noble.fakedPeripherals
    }

    private static get firstPeripheral() {
        return this.peripherals[0] as unknown as Peripheral
    }

    private static readonly timeoutMs = 10
    private static readonly durationMs = 10
    private static readonly expectedConstructorName = 'SpyBleController'

    private static FakeNoble() {
        return new FakeNoble()
    }

    private static FakePeripheral() {
        return new FakePeripheral()
    }

    private static FakeCharacteristic(options?: CharacteristicOptions) {
        return new FakeCharacteristic(options)
    }

    private static async BleController(peripheral = this.firstPeripheral) {
        return await BleDeviceController.Create({
            peripheral,
            characteristicCallbacks: {},
        })
    }

    private static BleScanner(options?: BleScannerOptions) {
        return BleDeviceScanner.Create({
            defaultDurationMs: this.durationMs,
            defaultTimeoutMs: this.timeoutMs,
            ...options,
        }) as SpyBleScanner
    }
}

type PartialOptions = Partial<ScanOptions>
