import { assertOptions } from '@sprucelabs/schema'
import { buildLog } from '@sprucelabs/spruce-skill-utils'
import { Characteristic, Peripheral, Service } from '@abandonware/noble'
import SpruceError from './errors/SpruceError'

export default class BleAdapterImpl implements BleAdapter {
    public static Class?: BleAdapterConstructor

    protected peripheral: Peripheral
    protected services!: Service[]
    protected characteristics!: Characteristic[]
    protected log = buildLog('BleAdapter')

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
        await this.connectToPeripheral()
        await this.discoverAllServicesAndCharacteristics()
        await this.subscribeToNotifiableCharacteristics()

        this.setupRssi()
    }

    private async connectToPeripheral() {
        await this.peripheral.connectAsync()
    }

    private async discoverAllServicesAndCharacteristics() {
        const { services, characteristics } = await this.discoverAll()

        this.services = services
        this.characteristics = characteristics
    }

    private async discoverAll() {
        return await this.peripheral.discoverAllServicesAndCharacteristicsAsync()
    }

    private async subscribeToNotifiableCharacteristics() {
        for (const characteristic of this.characteristics) {
            if (characteristic.properties.includes('notify')) {
                await this.tryToSubscribe(characteristic)
            }
        }
    }

    private async tryToSubscribe(characteristic: Characteristic) {
        try {
            await characteristic.subscribeAsync()
        } catch {
            const { uuid } = characteristic
            this.throwCharacteristicSubscribeFailed(uuid)
        }
    }

    protected throwCharacteristicSubscribeFailed(uuid: string) {
        throw new SpruceError({
            code: 'CHARACTERISTIC_SUBSCRIBE_FAILED',
            characteristicUuid: uuid,
        })
    }

    private setupRssi() {
        this.peripheral.on('rssiUpdate', this.handleRssiUpdate.bind(this))
    }

    private get advertisement() {
        return this.peripheral.advertisement
    }

    private get localName() {
        return this.advertisement.localName
    }

    private handleRssiUpdate(rssi: number) {
        this.log.info(`RSSI (${this.localName}): ${rssi}`)
    }
}

export interface BleAdapter {
    connect(): Promise<void>
}

export type BleAdapterConstructor = new (peripheral: Peripheral) => BleAdapter
