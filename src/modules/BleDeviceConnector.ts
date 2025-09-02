import { BleController } from './BleDeviceController'
import BleDeviceScanner, { BleScanner, ScanOptions } from './BleDeviceScanner'

export default class BleDeviceConnector implements BleConnector {
    public static Class?: BleConnectorConstructor

    protected ble!: BleController
    private scanner: BleScanner
    private scanOptions: ScanOptions
    private deviceLocalName: string
    private deviceUuid?: string

    protected constructor(options: BleConnectorConstructorOptions) {
        const { scanner, scanOptions, deviceLocalName, deviceUuid } = options

        this.scanner = scanner
        this.scanOptions = scanOptions
        this.deviceLocalName = deviceLocalName
        this.deviceUuid = deviceUuid
    }

    public static async Create(options: BleConnectorOptions) {
        const { connectBleOnCreate = true, ...constructorOptions } = options
        const scanner = this.BleDeviceScanner()

        const instance = new (this.Class ?? this)({
            scanner,
            ...constructorOptions,
        })

        if (connectBleOnCreate) {
            await instance.connectBle()
        }

        return instance
    }

    public async connectBle() {
        if (!this.ble && this.hasUuidForSpeedOptimization) {
            await this.fastScanForUuid()
        } else {
            await this.slowScanForName()
        }
        return this.ble
    }

    private get hasUuidForSpeedOptimization() {
        return this.deviceUuid
    }

    private async fastScanForUuid() {
        this.ble = await this.scanner.scanForUuid(
            this.deviceUuid!,
            this.scanOptions
        )
    }

    private async slowScanForName() {
        this.ble = await this.scanner.scanForName(
            this.deviceLocalName,
            this.scanOptions
        )
    }

    public async disconnectBle() {
        await this.ble.disconnect()
    }

    public getBleController() {
        return this.ble
    }

    private static BleDeviceScanner() {
        return BleDeviceScanner.Create()
    }
}

export interface BleConnector {
    connectBle(): Promise<BleController>
    disconnectBle(): Promise<void>
    getBleController(): BleController
}

export interface BleConnectorOptions {
    scanOptions: ScanOptions
    deviceLocalName: string
    deviceUuid?: string
    connectBleOnCreate?: boolean
}

export type BleConnectorConstructor = new (
    options: BleConnectorConstructorOptions
) => BleConnector

export interface BleConnectorConstructorOptions {
    scanner: BleScanner
    scanOptions: ScanOptions
    deviceLocalName: string
    deviceUuid?: string
}
