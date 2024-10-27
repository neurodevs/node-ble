import { generateId } from '@sprucelabs/test-utils'
import { Peripheral } from '@abandonware/noble'
import BleAdapterImpl from '../BleAdapter'
import { BleScanner, ScanOptions } from '../BleScanner'
import FakePeripheral from './noble/FakePeripheral'

export default class FakeBleScanner implements BleScanner {
    public static fakedPeripherals: FakePeripheral[] = []

    public static numCallsToConstructor = 0
    public static numCallsToScanAll = 0
    public static callsToScanForPeripheral: FakeScanForPeripheralCall[] = []
    public static callsToScanForPeripherals: FakeScanForPeripheralsCall[] = []
    public static callsToScanForName: string[] = []
    public static callsToScanForNames: string[][] = []
    public static numCallsToStopScanning = 0

    public constructor() {
        FakeBleScanner.numCallsToConstructor++
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
        this.callsToScanForPeripheral.push({ uuid, options })

        const peripheral = this.findByUuid(uuid)
        return this.BleAdapter(peripheral)
    }

    public async scanForUuids(uuids: string[], options?: ScanOptions) {
        this.callsToScanForPeripherals.push({ uuids, options })

        const peripherals = this.findByUuids(uuids)
        return await this.createAdapters(peripherals)
    }

    public async scanForName(name: string) {
        this.callsToScanForName.push(name)

        const peripheral = this.findByName(name)
        return this.BleAdapter(peripheral)
    }

    public async scanForNames(names: string[]) {
        this.callsToScanForNames.push(names)

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
        return Promise.all(peripherals.map((p) => BleAdapterImpl.Create(p)))
    }

    private getLocalName(peripheral: FakePeripheral) {
        return peripheral.advertisement.localName
    }

    private get callsToScanForPeripheral() {
        return FakeBleScanner.callsToScanForPeripheral
    }

    private get callsToScanForPeripherals() {
        return FakeBleScanner.callsToScanForPeripherals
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
        return BleAdapterImpl.Create(peripheral)
    }

    public static resetTestDouble() {
        this.fakedPeripherals = []
        this.numCallsToConstructor = 0
        this.callsToScanForPeripheral = []
        this.callsToScanForPeripherals = []
        this.numCallsToStopScanning = 0
    }
}

export interface FakeScanForPeripheralCall {
    uuid: string
    options?: ScanOptions
}

export interface FakeScanForPeripheralsCall {
    uuids: string[]
    options?: ScanOptions
}
