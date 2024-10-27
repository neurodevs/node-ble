import { assertOptions } from '@sprucelabs/schema'
import { Characteristic, Peripheral, Service } from '@abandonware/noble'

export default class BleAdapterImpl implements BleAdapter {
    public static Class?: BleAdapterConstructor

    protected peripheral: Peripheral

    protected constructor(options: BleAdapterOptions) {
        const { peripheral } = options
        this.peripheral = peripheral
    }

    public static async Create(peripheral: Peripheral) {
        assertOptions({ peripheral }, ['peripheral'])
        await peripheral.connectAsync()

        const r = await peripheral.discoverAllServicesAndCharacteristicsAsync()
        const { services, characteristics } = r

        return new (this.Class ?? this)({
            peripheral,
            services,
            characteristics,
        })
    }
}

export interface BleAdapter {}

export type BleAdapterConstructor = new (
    options: BleAdapterOptions
) => BleAdapter

export interface BleAdapterOptions {
    peripheral: Peripheral
    services: Service[]
    characteristics: Characteristic[]
}
