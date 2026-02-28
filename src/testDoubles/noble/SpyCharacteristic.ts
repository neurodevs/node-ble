import { EventEmitter } from 'events'
import { Descriptor } from '@abandonware/noble'
import generateId from '@neurodevs/generate-id'

export default class SpyCharacteristic extends EventEmitter {
    public uuid: string
    public name: string
    public type: string
    public properties: string[]
    public descriptors: Descriptor[]
    public didSubscribe = false
    public writes: [data: Buffer, withoutResponse: boolean][] = []
    public bufferMessage = generateId()

    public constructor(uuid = generateId()) {
        super()

        this.uuid = uuid
        this.name = generateId()
        this.type = generateId()
        this.properties = []
        this.descriptors = []
    }

    public on(...args: any) {
        //@ts-ignore
        return super.on(...args)
    }

    public [EventEmitter.captureRejectionSymbol]?(
        _error: Error,
        _ev_ent: string,
        ..._args: any[]
    ): void {}

    public emit(...args: any[]) {
        //@ts-ignore
        return super.emit(...args)
    }

    public async readAsync() {
        return Buffer.from(this.bufferMessage)
    }

    public writeAsync(_data: Buffer, _withoutResponse: boolean): Promise<void> {
        throw new Error('Method not implemented.')
    }

    public broadcastAsync(_broadcast: boolean): Promise<void> {
        throw new Error('Method not implemented.')
    }

    public notifyAsync(_notify: boolean): Promise<void> {
        throw new Error('Method not implemented.')
    }

    public async discoverDescriptorsAsync(): Promise<Descriptor[]> {
        return []
    }

    public toString() {
        return generateId()
    }

    public async subscribeAsync(): Promise<void> {}

    public async unsubscribeAsync(): Promise<void> {}

    public once(..._args: any[]): this {
        return this
    }

    public addListener(
        _eventName: string | symbol,
        _listener: (...args: any[]) => void
    ): this {
        return this
    }

    public removeListener(
        _eventName: string | symbol,
        _listener: (...args: any[]) => void
    ): this {
        throw new Error('Method not implemented.')
    }

    public off(
        _eventName: string | symbol,
        _listener: (...args: any[]) => void
    ): this {
        return this
    }

    public removeAllListeners(_event?: string | symbol | undefined): this {
        return this
    }

    public setMaxListeners(_n: number): this {
        return this
    }

    public getMaxListeners(): number {
        return 0
    }

    //@ts-ignore
    public listeners(_eventName: string | symbol): Function[] {
        return []
    }

    //@ts-ignore
    public rawListeners(_eventName: string | symbol): Function[] {
        return []
    }

    public listenerCount(
        _eventName: string | symbol,
        _listener?: Function | undefined
    ): number {
        throw new Error('Method not implemented.')
    }

    public prependListener(
        _eventName: string | symbol,
        _listener: (...args: any[]) => void
    ): this {
        throw new Error('Method not implemented.')
    }

    public prependOnceListener(
        _eventName: string | symbol,
        _listener: (...args: any[]) => void
    ): this {
        throw new Error('Method not implemented.')
    }

    public eventNames(): (string | symbol)[] {
        throw new Error('Method not implemented.')
    }
}
