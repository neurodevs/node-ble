import { assertOptions } from '@sprucelabs/schema'
import { buildLog } from '@sprucelabs/spruce-skill-utils'
import { Characteristic, Peripheral, Service } from '@abandonware/noble'
import SpruceError from '../errors/SpruceError'

export default class BleDeviceAdapter implements BleAdapter {
    public static Class?: BleAdapterConstructor
    public static setInterval = setInterval

    protected peripheral: Peripheral
    protected services!: Service[]
    protected characteristics!: Characteristic[]
    protected characteristicCallbacks: CharacteristicCallbacks
    protected rssiIntervalMs: number
    protected isIntentionalDisconnect = false
    protected log = buildLog('BleAdapter')
    private shouldUpdateRssi: boolean
    private rssiIntervalPid: any
    private characteristic!: Characteristic

    protected constructor(
        peripheral: Peripheral,
        options: BleAdapterConstructorOptions
    ) {
        this.peripheral = peripheral

        const { shouldUpdateRssi, rssiIntervalMs, characteristicCallbacks } =
            options

        this.shouldUpdateRssi = shouldUpdateRssi
        this.rssiIntervalMs = rssiIntervalMs
        this.characteristicCallbacks = characteristicCallbacks ?? {}
    }

    public static async Create(
        peripheral: Peripheral,
        options?: BleAdapterOptions
    ) {
        assertOptions({ peripheral }, ['peripheral'])

        const {
            shouldConnect = true,
            shouldUpdateRssi = true,
            rssiIntervalMs = 10000,
            characteristicCallbacks,
        } = options ?? {}

        const constructorOptions = {
            shouldUpdateRssi,
            rssiIntervalMs,
            characteristicCallbacks,
        }

        const adapter = new (this.Class ?? this)(peripheral, constructorOptions)

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

        this.setupRssiIfEnabled()
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
            this.characteristic = characteristic
            await this.tryToSubscribeForNotifiable()
        }
    }

    private async tryToSubscribeForNotifiable() {
        if (this.currentCharacteristicIsNotifiable) {
            await this.tryToSubscribe()
        }
    }

    private get currentCharacteristicIsNotifiable() {
        return this.characteristic.properties.includes('notify')
    }

    private async tryToSubscribe() {
        try {
            await this.characteristic.subscribeAsync()
            this.setCharacteristicCallbackIfExists()
        } catch {
            this.throwCharacteristicSubscribeFailed()
        }
    }

    private setCharacteristicCallbackIfExists() {
        if (this.currentCharacteristicHasCallback) {
            this.characteristic.on(
                'data',
                this.characteristicCallbacks?.[this.characteristic.uuid]
            )
        }
    }

    private get currentCharacteristicHasCallback() {
        return this.characteristicCallbackUuids.includes(
            this.currentCharacteristicUuid
        )
    }

    private get currentCharacteristicUuid() {
        return this.characteristic.uuid
    }

    private throwCharacteristicSubscribeFailed() {
        throw new SpruceError({
            code: 'CHARACTERISTIC_SUBSCRIBE_FAILED',
            characteristicUuid: this.currentCharacteristicUuid,
        })
    }

    private setupRssiIfEnabled() {
        if (this.shouldUpdateRssi) {
            this.setIntervalForRssi()
        }
        this.setupRssiUpdateHandler()
    }

    private setIntervalForRssi() {
        this.rssiIntervalPid = this.setInterval(
            this.peripheral.updateRssiAsync.bind(this.peripheral),
            this.rssiIntervalMs
        )
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
        this.clearRssiInterval()
        this.teardownRssiUpdateHandler()
        this.teardownDisconnectHandler()

        await this.handleIntentionForDisconnect()
    }

    private clearRssiInterval() {
        clearInterval(this.rssiIntervalPid)
    }

    private async handleIntentionForDisconnect() {
        if (!this.isIntentionalDisconnect) {
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

        if (this.isConnected) {
            await this.tryToDisconnect()
        }
    }

    private get isConnected() {
        return !this.disconnectStates.includes(this.peripheral.state)
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

    private get setInterval() {
        return BleDeviceAdapter.setInterval
    }

    private get characteristicCallbackUuids() {
        return Object.keys(this.characteristicCallbacks)
    }
}

export interface BleAdapter {
    connect(): Promise<void>
    disconnect(): Promise<void>
}

export type BleAdapterConstructor = new (
    peripheral: Peripheral,
    options: BleAdapterConstructorOptions
) => BleAdapter

export interface BleAdapterOptions {
    shouldConnect?: boolean
    shouldUpdateRssi?: boolean
    rssiIntervalMs?: number
    characteristicCallbacks?: CharacteristicCallbacks
}

export interface BleAdapterConstructorOptions {
    shouldUpdateRssi: boolean
    rssiIntervalMs: number
    characteristicCallbacks?: CharacteristicCallbacks
}

export type CharacteristicCallbacks = Record<
    CharacteristicUuid,
    (data: Buffer) => void
>

export type CharacteristicUuid = string
