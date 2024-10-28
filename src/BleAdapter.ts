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
        this.log.info(this.connectingMessage)

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
            this.throwCharacteristicSubscribeFailed(uuid)
        }
    }

    private throwCharacteristicSubscribeFailed(uuid: string) {
        throw new SpruceError({
            code: 'CHARACTERISTIC_SUBSCRIBE_FAILED',
            characteristicUuid: uuid,
        })
    }

    private setupRssiUpdateHandler() {
        this.peripheral.on('rssiUpdate', this.handleRssiUpdate)
    }

    private handleRssiUpdate = (rssi: number) => {
        this.log.info(`RSSI (${this.localName}): ${rssi}`)
    }

    private teardownRssiUpdateHandler() {
        this.peripheral.off('rssiUpdate', this.handleRssiUpdate)
    }

    private setupDisconnectHandler() {
        this.peripheral.on('disconnect', this.handleDisconnect)
    }

    private handleDisconnect = async () => {
        this.teardownRssiUpdateHandler()
        this.teardownDisconnectHandler()
        await this.handleIntentionForDisconnect()
    }

    private async handleIntentionForDisconnect() {
        if (this.isIntentionalDisconnect) {
            this.log.info(this.intentionalDisconnectMessage)
        } else {
            this.log.warn(this.unintentionalDisconnectMessage)
            await this.reconnect()
        }
    }

    private teardownDisconnectHandler() {
        this.peripheral.off('disconnect', this.handleDisconnect)
    }

    private async reconnect() {
        this.log.info(this.reconnectingMessage)
        await this.connect()
        this.log.info(this.reconnectedMessage)
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

    private get connectingMessage() {
        return `Connecting to ${this.localName}...`
    }

    private get intentionalDisconnectMessage() {
        return `Disconnected from ${this.localName}!`
    }

    private get unintentionalDisconnectMessage() {
        return `Unexpectedly disconnected from ${this.localName}!`
    }

    private get reconnectingMessage() {
        return `Reconnecting to ${this.localName}...`
    }

    private get reconnectedMessage() {
        return `Reconnected to ${this.localName}!`
    }

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
