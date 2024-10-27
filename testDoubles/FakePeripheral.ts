import { generateId } from '@sprucelabs/test-utils'

export default class FakePeripheral implements SimplePeripheral {
    public didCallConnect = false
    public didCallConnectAsync = false

    public uuid: string

    public advertisement = {
        localName: generateId(),
        manufacturerData: Buffer.from([0x01, 0x02, 0x03, 0x04]),
    }

    public rssi = Math.random() * 100

    public connectable = true

    public constructor(uuid?: string) {
        this.uuid = uuid ?? generateId()
    }

    public connect() {
        this.didCallConnect = true
    }

    public async connectAsync() {
        this.didCallConnectAsync = true
    }

    public resetTestDouble() {
        this.didCallConnect = false
        this.didCallConnectAsync = false
    }
}

export interface SimplePeripheral {
    uuid: string
    advertisement: {
        localName: string
        manufacturerData: Buffer
    }
    rssi: number
    connectable: boolean
    connect(): void
    connectAsync(): Promise<void>
}
