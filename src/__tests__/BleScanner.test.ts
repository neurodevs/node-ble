import AbstractSpruceTest, {
    test,
    assert,
    generateId,
    errorAssert,
} from '@sprucelabs/test-utils'
import noble, { Peripheral } from '@abandonware/noble'
import BleDeviceAdapter, { BleAdapter } from '../components/BleDeviceAdapter'
import BleDeviceScanner, {
    BleScannerOptions,
    ScanOptions,
} from '../components/BleDeviceScanner'
import FakeNoble, { CreateFakePeripheral } from '../testDoubles/noble/FakeNoble'
import FakePeripheral from '../testDoubles/noble/FakePeripheral'
import SpyBleScanner from '../testDoubles/SpyBleScanner'

export default class BleScannerTest extends AbstractSpruceTest {
    private static instance: SpyBleScanner
    private static noble: FakeNoble
    private static uuid: string

    protected static async beforeEach() {
        await super.beforeEach()

        BleDeviceScanner.Class = SpyBleScanner

        this.uuid = generateId()
        this.setupFakeNoble()

        this.instance = this.BleScanner()
    }

    @test()
    protected static async canCreateBleScanner() {
        assert.isTruthy(this.instance)
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
    protected static async scanForUuidsReturnsAdapters() {
        const adapters = await this.scanForUuids()
        const mapped = await this.mapPeripheralsToAdapters()

        assert.isEqualDeep(
            this.removeLogFromEachAdapter(adapters),
            this.removeLogFromEachAdapter(mapped),
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
        const adapters = await this.scanForUuids()
        assert.isEqual(adapters.length, 1, 'Should have found 1 adapter!')
    }

    @test()
    protected static async canScanForPeripheralByName() {
        this.clearNoble()

        const name = generateId()
        this.fakePeripherals([{ name }])

        const adapter = await this.scanForName(name)

        assert.isEqual(
            adapter.constructor.name,
            'BleDeviceAdapter',
            'scan should return the faked peripherals!'
        )
    }

    @test()
    protected static async canScanByNames() {
        this.clearNoble()

        const name = generateId()
        this.fakePeripherals([{ name }])

        const adapters = await this.scanForNames([name])

        assert.isLength(adapters, 1, 'Should return one adapter!')
    }

    @test()
    protected static async scanForNamesWorksWithTwoPeripherals() {
        this.noble.clearTestDouble()

        const name1 = generateId()
        const name2 = generateId()
        this.fakePeripherals([{ name: name1 }, { name: name2 }])

        const adapters = await this.scanForNames([name1, name2])

        assert.isLength(adapters, 2)
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
    protected static async returnsBleAdapterWithPeripheral() {
        const result = await this.clearFakeOneScanForUuids()

        assert.isEqual(
            result[0].constructor.name,
            'BleDeviceAdapter',
            'Create should return a BleAdapter instance!'
        )
    }

    @test()
    protected static async scanForUuidReturnsBleAdapter() {
        const adapter = await this.scanForUuid()

        assert.isEqual(
            adapter.constructor.name,
            'BleDeviceAdapter',
            'scanForUuid should return a BleAdapter instance!'
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

    private static async mapPeripheralsToAdapters() {
        return await Promise.all(
            this.peripherals.map((peripheral) =>
                this.BleAdapter(peripheral as unknown as Peripheral)
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

    private static async scanForUuid(uuid = this.uuid, options?: ScanOptions) {
        return await this.instance.scanForUuid(uuid, options)
    }

    private static async scanForUuids(
        uuids = this.uuids,
        options?: ScanOptions
    ) {
        return await this.instance.scanForUuids(uuids, options)
    }

    private static async scanForName(name: string, options?: ScanOptions) {
        const { timeoutMs = this.timeoutMs } = options ?? {}
        return await this.instance.scanForName(name, { timeoutMs })
    }

    private static async scanForNames(names: string[], options?: ScanOptions) {
        return await this.instance.scanForNames(names, options)
    }

    private static async stopScanning() {
        await this.instance.stopScanning()
    }

    private static removeLogFromEachAdapter(adapters: BleAdapter[]) {
        return adapters.map((adapter: any) => delete adapter.log)
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

    private static FakeNoble() {
        return new FakeNoble()
    }

    private static async BleAdapter(peripheral = this.firstPeripheral) {
        return await BleDeviceAdapter.Create(peripheral)
    }

    private static BleScanner(options?: BleScannerOptions) {
        return BleDeviceScanner.Create({
            defaultDurationMs: this.durationMs,
            defaultTimeoutMs: this.timeoutMs,
            ...options,
        }) as SpyBleScanner
    }
}
