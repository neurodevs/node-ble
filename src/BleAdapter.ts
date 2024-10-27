import { assertOptions } from '@sprucelabs/schema'
import { Characteristic, Peripheral, Service } from '@abandonware/noble'

export default class BleAdapterImpl implements BleAdapter {
    public static Class?: BleAdapterConstructor

    protected peripheral: Peripheral
    protected services!: Service[]
    protected characteristics!: Characteristic[]

    protected constructor(peripheral: Peripheral) {
        this.peripheral = peripheral
    }

    public static async Create(peripheral: Peripheral) {
        assertOptions({ peripheral }, ['peripheral'])

        const adapter = new (this.Class ?? this)(peripheral)
        await adapter.connect()

        return adapter
    }

    public async connect() {
        await this.peripheral.connectAsync()

        const { services, characteristics } = await this.discoverAll()

        this.services = services
        this.characteristics = characteristics
    }

    private async discoverAll() {
        return await this.peripheral.discoverAllServicesAndCharacteristicsAsync()
    }
}

export interface BleAdapter {
    connect(): Promise<void>
}

export type BleAdapterConstructor = new (peripheral: Peripheral) => BleAdapter
