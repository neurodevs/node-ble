import noble, { Peripheral } from '@abandonware/noble'
import BleAdapterImpl, { BleAdapter } from './BleAdapter'
import SpruceError from './errors/SpruceError'

export default class BleScannerImpl implements BleScanner {
    public static Class?: BleScannerConstructor
    public static noble = noble

    protected peripherals: Peripheral[] = []
    protected uuids: string[] = []
    protected names: string[] = []
    protected isScanning = false
    protected timeoutMs: number
    protected durationMs: number
    private scanPromise!: ScanPromise
    private timeoutPromise!: ScanPromise
    private resolvePromise!: (peripherals: Peripheral[]) => void
    private shouldThrowOnTimeout = true

    protected constructor(options?: BleScannerOptions) {
        const { defaultTimeoutMs, defaultDurationMs } = options ?? {}

        this.timeoutMs = defaultTimeoutMs ?? 10000
        this.durationMs = defaultDurationMs ?? 10000

        this.setupOnDiscover()
    }

    private setupOnDiscover() {
        this.noble.on('discover', this.handleOnDiscover.bind(this))
    }

    private async handleOnDiscover(peripheral: Peripheral) {
        const { uuid, advertisement } = peripheral
        const { localName } = advertisement

        if (this.shouldReturnAll || this.isTargetPeripheral(uuid, localName)) {
            this.peripherals.push(peripheral)

            if (this.isDone) {
                await this.stopScanning()
            }
        }
    }

    private get shouldReturnAll() {
        return this.uuids.length === 0 && this.names.length === 0
    }

    private isTargetPeripheral(uuid: string, name: string) {
        return this.uuids.includes(uuid) || this.names.includes(name)
    }

    private get isDone() {
        return this.allUuidsFound || this.allNamesFound
    }

    private get allUuidsFound() {
        return (
            this.uuids.length > 0 &&
            this.uuids.length === this.peripherals.length
        )
    }

    private get allNamesFound() {
        return (
            this.names.length > 0 &&
            this.names.length === this.peripherals.length
        )
    }

    public static Create(options?: BleScannerOptions) {
        return new (this.Class ?? this)(options)
    }

    public async scanAll(durationMs = this.durationMs) {
        this.durationMs = durationMs

        this.resetUuids()
        this.resetNames()
        this.resetPeripherals()

        this.scanPromise = this.createScanPromise()

        await this.setTimeout(this.durationMs, false)
        await this.stopScanning()

        return this.peripherals
    }

    public async scanForUuids(uuids: string[], options?: ScanOptions) {
        this.destructureAndSetTimeoutMs(options)

        this.uuids = uuids
        this.resetNames()
        this.resetPeripherals()

        return await this.scan()
    }

    public async scanForUuid(uuid: string, options?: ScanOptions) {
        return (await this.scanForUuids([uuid], options))[0]
    }

    public async scanForNames(names: string[], options?: ScanOptions) {
        this.destructureAndSetTimeoutMs(options)

        this.resetUuids()
        this.names = names
        this.resetPeripherals()

        return await this.scan()
    }

    public async scanForName(name: string, options?: ScanOptions) {
        return (await this.scanForNames([name], options))[0]
    }

    public async stopScanning() {
        this.isScanning = false
        await this.noble.stopScanningAsync()
        this.resolvePromise(this.peripherals)
    }

    private async scan() {
        this.scanPromise = this.createScanPromise()
        await this.setTimeout()
        return this.createAdapters()
    }

    private createScanPromise() {
        this.isScanning = true

        return new Promise((resolve, reject) => {
            this.resolvePromise = resolve
            this.noble.startScanningAsync([], false).catch(reject)
        }) as ScanPromise
    }

    private async setTimeout(timeoutMs = this.timeoutMs, shouldThrow = true) {
        this.shouldThrowOnTimeout = shouldThrow
        this.timeoutPromise = this.createTimeoutPromise(timeoutMs)

        return this.startPromiseRace()
    }

    private async createAdapters() {
        return await Promise.all(
            this.peripherals.map((peripheral) =>
                BleAdapterImpl.Create(peripheral)
            )
        )
    }

    private destructureAndSetTimeoutMs(options?: ScanOptions) {
        const { timeoutMs = this.timeoutMs } = options ?? {}
        this.timeoutMs = timeoutMs
    }

    private createTimeoutPromise(timeoutMs = this.timeoutMs) {
        return new Promise((resolve, reject) => {
            const timeoutId = setTimeout(() => {
                this.shouldThrowOnTimeout
                    ? reject(this.throwScanTimedOut())
                    : resolve(this.peripherals)
            }, timeoutMs)

            void this.scanPromise.finally(() => clearTimeout(timeoutId))
        }) as ScanPromise
    }

    private startPromiseRace() {
        return Promise.race([
            this.scanPromise,
            this.timeoutPromise,
        ]) as ScanPromise
    }

    private throwScanTimedOut() {
        return new SpruceError({
            code: 'SCAN_TIMED_OUT',
            timeoutMs: this.timeoutMs!,
            uuids: this.uuids,
            names: this.names,
        })
    }

    private resetUuids() {
        this.uuids = []
    }

    private resetNames() {
        this.names = []
    }

    private resetPeripherals() {
        this.peripherals = []
    }

    private get noble() {
        return BleScannerImpl.noble
    }
}

export interface BleScanner {
    scanAll(durationMs?: number): Promise<Peripheral[]>
    scanForUuid(uuid: string, options?: ScanOptions): Promise<BleAdapter>
    scanForUuids(uuids: string[], options?: ScanOptions): Promise<BleAdapter[]>
    scanForName(name: string, options?: ScanOptions): Promise<BleAdapter>
    scanForNames(names: string[], options?: ScanOptions): Promise<BleAdapter[]>
    stopScanning(): Promise<void>
}

export type BleScannerConstructor = new (
    options?: BleScannerOptions
) => BleScanner

export interface BleScannerOptions {
    defaultTimeoutMs?: number
    defaultDurationMs?: number
}

export interface ScanOptions {
    timeoutMs?: number
}

export type ScanPromise = Promise<Peripheral[]>
