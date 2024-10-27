import { EventEmitter } from 'stream'
import { generateId } from '@sprucelabs/test-utils'
import FakePeripheral from './FakePeripheral'

export default class FakeNoble extends EventEmitter {
    public numCallsToConstructor = 0
    public numCallsToStopScanningAsync = 0
    public numCallsToStartScanning = 0
    public numCallsToStopScanning = 0
    public numCallsToCancelConnect = 0
    public callsToStartScanningAsync: CallToStartScanningAsync[] = []
    public callsToOn: EventOperation[] = []
    public callsToOnce: EventOperation[] = []
    public callsToRemoveListener: EventOperation[] = []

    public constructor() {
        super()
        this.numCallsToConstructor++
    }

    public fakedPeripherals: FakePeripheral[] = []

    public fakePeripherals(fakes: CreateFakePeripheral[]) {
        return fakes.map((fake) => {
            const { uuid, name } = fake
            const peripheral = this.createFakePeripheral({ uuid, name })
            this.fakedPeripherals.push(peripheral)
            return peripheral
        })
    }

    private createFakePeripheral(options?: { uuid?: string; name?: string }) {
        const { uuid = generateId(), name = generateId() } = options ?? {}
        return new FakePeripheral({ uuid, localName: name })
    }

    public on(eventName: string | symbol, listener: (...args: any[]) => void) {
        this.callsToOn.push({ eventName, listener })
        super.on(eventName, listener)
        return this
    }

    public once(
        eventName: string | symbol,
        listener: (...args: any[]) => void
    ) {
        this.callsToOnce.push({ eventName, listener })
        super.once(eventName, listener)
        return this
    }

    public removeListener(
        eventName: string | symbol,
        listener: (...args: any[]) => void
    ) {
        this.callsToRemoveListener.push({ eventName, listener })
        super.removeListener(eventName, listener)
        return this
    }

    public async startScanningAsync(uuids: string[], allowDuplicates: boolean) {
        this.callsToStartScanningAsync.push({ uuids, allowDuplicates })

        this.fakedPeripherals.forEach((fakePeripheral) => {
            this.emit('discover', fakePeripheral)
        })
    }

    public async stopScanningAsync() {
        this.numCallsToStopScanningAsync++
    }

    public startScanning() {
        this.numCallsToStartScanning++
    }

    public stopScanning() {
        this.numCallsToStopScanning++
    }

    public cancelConnect() {
        this.numCallsToCancelConnect++
    }

    public _state: any
    public _bindings: any
    public Peripheral: any
    public Service: any
    public Characteristic: any
    public Descriptor: any

    public clearTestDouble() {
        this.numCallsToConstructor = 0
        this.numCallsToStopScanningAsync = 0
        this.numCallsToStartScanning = 0
        this.numCallsToStopScanning = 0
        this.numCallsToCancelConnect = 0
        this.callsToStartScanningAsync = []
        this.callsToOn = []
        this.callsToOnce = []
        this.callsToRemoveListener = []
        this.fakedPeripherals = []
    }
}

export interface EventOperation {
    eventName: string | symbol
    listener: (...args: any[]) => void
}

export interface CallToStartScanningAsync {
    uuids: string[]
    allowDuplicates: boolean
}

export interface CreateFakePeripheral {
    uuid?: string
    name?: string
}
