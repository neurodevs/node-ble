import { assertOptions } from '@sprucelabs/schema'
import { buildLog } from '@sprucelabs/spruce-skill-utils'
import { Characteristic, Peripheral, Service } from '@abandonware/noble'
import SpruceError from './errors/SpruceError'

export default class BleAdapterImpl implements BleAdapter {
    public static Class?: BleAdapterConstructor

    protected peripheral: Peripheral
    protected services!: Service[]
    protected characteristics!: Characteristic[]
    protected isIntentionalDisconnect = false
    protected log = buildLog('BleAdapter')

    protected constructor(peripheral: Peripheral) {
        this.peripheral = peripheral
    }

    public static async Create(
        peripheral: Peripheral,
        options?: BleAdapterOptions
    ) {
        assertOptions({ peripheral }, ['peripheral'])
        const { shouldConnect = true } = options ?? {}

        const adapter = new (this.Class ?? this)(peripheral)

        if (shouldConnect) {
            await adapter.connect()
        }

        return adapter
    }

    public async connect() {
        this.resetIsIntentionalDisconnectFlag()

        await this.connectToPeripheral()
        await this.discoverAllServicesAndCharacteristics()
        await this.subscribeToNotifiableCharacteristics()

        this.setupRssiUpdateHandler()
        this.setupDisconnectHandler()
    }

    private resetIsIntentionalDisconnectFlag() {
        this.isIntentionalDisconnect = false
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
            throw new SpruceError({
                code: 'CHARACTERISTIC_SUBSCRIBE_FAILED',
                characteristicUuid: uuid,
            })
        }
    }

    private setupRssiUpdateHandler() {
        this.peripheral.on('rssiUpdate', this.handleRssiUpdate.bind(this))
    }

    private handleRssiUpdate(rssi: number) {
        this.log.info(`RSSI (${this.localName}): ${rssi}`)
    }

    private teardownRssiUpdateHandler() {
        this.peripheral.off('rssiUpdate', this.handleRssiUpdate.bind(this))
    }

    private setupDisconnectHandler() {
        this.peripheral.on('disconnect', this.handleDisconnect.bind(this))
    }

    private async handleDisconnect() {
        if (!this.isIntentionalDisconnect) {
            this.log.warn(`BLE disconnected from ${this.localName}!`)
        }
        this.teardownRssiUpdateHandler()
        this.teardownDisconnectHandler()
    }

    private teardownDisconnectHandler() {
        this.peripheral.off('disconnect', this.handleDisconnect.bind(this))
    }

    public async disconnect() {
        this.isIntentionalDisconnect = true

        if (!this.isDisconnected) {
            await this.tryToDisconnect()
        }
    }

    private get isDisconnected() {
        return this.disconnectStates.includes(this.peripheral.state)
    }

    private async tryToDisconnect() {
        try {
            await this.peripheral.disconnectAsync()
        } catch (err: any) {
            throw new SpruceError({
                code: 'DEVICE_DISCONNECT_FAILED',
                localName: this.localName,
                originalError: err.message,
            })
        }
    }

    private readonly disconnectStates = ['disconnected', 'disconnecting']

    protected get advertisement() {
        return this.peripheral.advertisement
    }

    protected get localName() {
        return this.advertisement.localName
    }
}

export interface BleAdapter {
    connect(): Promise<void>
    disconnect(): Promise<void>
}

export interface BleAdapterOptions {
    shouldConnect?: boolean
}

export type BleAdapterConstructor = new (peripheral: Peripheral) => BleAdapter
