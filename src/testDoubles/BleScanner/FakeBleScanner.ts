import { generateId } from '@sprucelabs/test-utils'
import { Peripheral } from '@abandonware/noble'
import BleDeviceAdapter from '../../components/BleDeviceAdapter'
import {
    BleScanner,
    BleScannerOptions,
    ScanOptions,
} from '../../components/BleDeviceScanner'
import FakePeripheral from '../noble/FakePeripheral'

export default class FakeBleScanner implements BleScanner {
    public static fakedPeripherals: FakePeripheral[] = []

    public static callsToConstructor: (BleScannerOptions | undefined)[] = []
    public static numCallsToScanAll = 0
    public static callsToScanForUuid: CallToScanForUuid[] = []
    public static callsToScanForUuids: CallToScanForUuids[] = []
    public static callsToScanForName: CallToScanForName[] = []
    public static callsToScanForNames: CallToScanForNames[] = []
    public static numCallsToStopScanning = 0

    public constructor(options?: BleScannerOptions) {
        FakeBleScanner.callsToConstructor.push(options)
    }

    public static setFakedPeripherals(uuids = this.generateRandomUuids()) {
        this.fakedPeripherals = this.createFakePeripherals(uuids)
    }

    public static createFakePeripherals(uuids: string[]) {
        return uuids.map((uuid) => {
            return this.createFakePeripheral(uuid)
        })
    }

    public static createFakePeripheral(uuid?: string) {
        return new FakePeripheral({ uuid })
    }

    public static generateRandomUuids(num = 1) {
        return Array.from({ length: num }, () => generateId())
    }

    public async scanAll() {
        FakeBleScanner.numCallsToScanAll++
        return this.fakedPeripherals as unknown as Peripheral[]
    }

    public async scanForUuid(uuid: string, options?: ScanOptions) {
        this.callsToScanForUuid.push({ uuid, options })

        const peripheral = this.findByUuid(uuid)
        return this.BleAdapter(peripheral)
    }

    public async scanForUuids(uuids: string[], options?: ScanOptions) {
        this.callsToScanForUuids.push({ uuids, options })

        const peripherals = this.findByUuids(uuids)
        return await this.createAdapters(peripherals)
    }

    public async scanForName(name: string, options?: ScanOptions) {
        this.callsToScanForName.push({ name, options })

        const peripheral = this.findByName(name)
        return this.BleAdapter(peripheral)
    }

    public async scanForNames(names: string[], options?: ScanOptions) {
        this.callsToScanForNames.push({ names, options })

        const peripherals = this.findByNames(names)
        return await this.createAdapters(peripherals)
    }

    public async stopScanning() {
        FakeBleScanner.numCallsToStopScanning++
    }

    private findByUuid(uuid: string) {
        return this.findPeripheral(
            (peripheral: FakePeripheral) => peripheral.uuid === uuid
        )
    }

    private findByName(name: string) {
        return this.findPeripheral((peripheral: FakePeripheral) => {
            const localName = this.getLocalName(peripheral)
            return localName === name
        })
    }

    private findPeripheral(cb: (peripheral: FakePeripheral) => boolean) {
        return this.fakedPeripherals.find(cb) as unknown as Peripheral
    }

    private findByUuids(uuids: string[]) {
        return this.findPeripherals((peripheral: FakePeripheral) =>
            uuids.includes(peripheral.uuid)
        )
    }

    private findByNames(names: string[]) {
        return this.findPeripherals((peripheral: FakePeripheral) => {
            const localName = this.getLocalName(peripheral)
            return names.includes(localName)
        })
    }

    private findPeripherals(cb: (peripheral: FakePeripheral) => boolean) {
        return this.fakedPeripherals.filter(cb) as unknown as Peripheral[]
    }

    private async createAdapters(peripherals: Peripheral[]) {
        return Promise.all(peripherals.map((p) => BleDeviceAdapter.Create(p)))
    }

    private getLocalName(peripheral: FakePeripheral) {
        return peripheral.advertisement.localName
    }

    private get callsToScanForUuid() {
        return FakeBleScanner.callsToScanForUuid
    }

    private get callsToScanForUuids() {
        return FakeBleScanner.callsToScanForUuids
    }

    private get callsToScanForName() {
        return FakeBleScanner.callsToScanForName
    }

    private get callsToScanForNames() {
        return FakeBleScanner.callsToScanForNames
    }

    private get fakedPeripherals() {
        return FakeBleScanner.fakedPeripherals
    }

    private BleAdapter(peripheral: Peripheral) {
        return BleDeviceAdapter.Create(peripheral)
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToScanAll = 0
        this.callsToScanForUuid = []
        this.callsToScanForUuids = []
        this.callsToScanForName = []
        this.callsToScanForNames = []
        this.numCallsToStopScanning = 0
    }
}

export interface CallToScanForUuid {
    uuid: string
    options?: ScanOptions
}

export interface CallToScanForUuids {
    uuids: string[]
    options?: ScanOptions
}

export interface CallToScanForName {
    name: string
    options?: ScanOptions
}

export interface CallToScanForNames {
    names: string[]
    options?: ScanOptions
}
