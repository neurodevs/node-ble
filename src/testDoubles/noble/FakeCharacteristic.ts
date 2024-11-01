import { generateId } from '@sprucelabs/test-utils'
import { Descriptor } from '@abandonware/noble'

export default class FakeCharacteristic implements SimpleCharacteristic {
    public callsToConstructor: CharacteristicOptions[] = []
    public callsToOn: CharacteristicEventAndListener[] = []
    public callsToOff: CharacteristicEventAndListener[] = []
    public numCallsToReadAsync = 0
    public callsToWriteAsync: CallToWriteAsync[] = []
    public callsToBroadcastAsync: boolean[] = []
    public callsToNotifyAsync: boolean[] = []
    public numCallsToDiscoverDescriptorsAsync = 0
    public numCallsToSubscribeAsync = 0
    public numCallsToUnsubscribeAsync = 0
    public value: Buffer | null = null

    public uuid: string
    public properties: string[]
    public descriptors: Descriptor[] = []
    private isSubscribed = false

    public constructor(options?: CharacteristicOptions) {
        this.callsToConstructor.push(options ?? {})

        const { uuid = generateId(), properties = ['notify'] } = options ?? {}

        this.uuid = uuid
        this.properties = properties
    }

    public on(event: string, listener: () => void) {
        this.callsToOn.push({ event, listener })
    }

    public off(event: string, listener: () => void) {
        this.callsToOff.push({ event, listener })
    }

    public async readAsync() {
        this.numCallsToReadAsync++
        return this.value ?? Buffer.from('DefaultValue')
    }

    public async writeAsync(data: Buffer, withoutResponse: boolean) {
        this.callsToWriteAsync.push({ data, withoutResponse })
        this.value = data
    }

    public async broadcastAsync(broadcast: boolean) {
        this.callsToBroadcastAsync.push(broadcast)
    }

    public async notifyAsync(notify: boolean) {
        this.callsToNotifyAsync.push(notify)
    }

    public async discoverDescriptorsAsync() {
        this.numCallsToDiscoverDescriptorsAsync++
        return this.descriptors
    }

    public async subscribeAsync() {
        this.numCallsToSubscribeAsync++
        this.tryToSubscribe()
    }

    private tryToSubscribe() {
        if (this.properties.includes('notify')) {
            this.isSubscribed = true
        } else {
            throw new Error(
                `Characteristic ${this.uuid} does not support notifications!`
            )
        }
    }

    public async unsubscribeAsync() {
        this.numCallsToUnsubscribeAsync++
        this.tryToUnsubscribe()
    }

    private tryToUnsubscribe() {
        if (this.isSubscribed) {
            this.isSubscribed = false
        } else {
            throw new Error(`Characteristic ${this.uuid} is not subscribed!`)
        }
    }

    public simulateDataReceived(data: Buffer) {
        if (this.isSubscribed) {
            this.value = data
            this.emitData(data)
        } else {
            throw new Error(
                `Cannot receive data on unsubscribed characteristic ${this.uuid}!`
            )
        }
    }

    private emitData(data: Buffer) {
        console.log(`Fake data received on characteristic ${this.uuid}:`, data)
    }

    public resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToReadAsync = 0
        this.callsToWriteAsync = []
        this.callsToBroadcastAsync = []
        this.callsToNotifyAsync = []
        this.numCallsToDiscoverDescriptorsAsync = 0
        this.numCallsToSubscribeAsync = 0
        this.numCallsToUnsubscribeAsync = 0
        this.value = null
    }
}

export interface SimpleCharacteristic {
    uuid: string
    properties: string[]
    descriptors: Descriptor[]
    value: Buffer | null
    readAsync(): Promise<Buffer>
    writeAsync(data: Buffer, withoutResponse: boolean): Promise<void>
    broadcastAsync(broadcast: boolean): Promise<void>
    notifyAsync(notify: boolean): Promise<void>
    discoverDescriptorsAsync(): Promise<Descriptor[]>
    subscribeAsync(): Promise<void>
    unsubscribeAsync(): Promise<void>
}

export interface CharacteristicOptions {
    uuid?: string
    properties?: string[]
}

export interface CallToWriteAsync {
    data: Buffer
    withoutResponse: boolean
}

export interface CharacteristicEventAndListener {
    event: string
    listener: () => void
}
