import { Characteristic, Peripheral, Service } from '../noble/importNobleCjs.js'

export default class BleDeviceController implements BleController {
    public static Class?: BleControllerConstructor
    public static setInterval = setInterval

    protected peripheral: Peripheral
    protected characteristicCallbacks: CharacteristicCallbacks
    protected rssiIntervalMs?: number
    protected services!: Service[]
    protected characteristics!: Characteristic[]
    protected isIntentionalDisconnect = false
    protected log = console
    private rssiIntervalPid?: NodeJS.Timeout

    protected constructor(options: BleControllerConstructorOptions) {
        const { peripheral, characteristicCallbacks, rssiIntervalMs } = options

        this.peripheral = peripheral
        this.characteristicCallbacks = characteristicCallbacks
        this.rssiIntervalMs = rssiIntervalMs
    }

    public static async Create(options: BleControllerOptions) {
        const { shouldConnect = true, ...constructorOptions } = options ?? {}
        const instance = new (this.Class ?? this)(constructorOptions)

        if (shouldConnect) {
            await instance.connect()
        }

        return instance
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
        for (const char of this.characteristics) {
            await this.tryToSubscribeForNotifiable(char)
        }
    }

    private async tryToSubscribeForNotifiable(char: Characteristic) {
        if (char.properties.includes('notify')) {
            await this.tryToSubscribe(char)
        }
    }

    private async tryToSubscribe(char: Characteristic) {
        try {
            await char.subscribeAsync()
            this.setCharacteristicCallbackIfExists(char)
        } catch (err) {
            this.throwCharacteristicSubscribeFailed(char.uuid, err)
        }
    }

    private setCharacteristicCallbackIfExists(char: Characteristic) {
        const hasCallback = this.characteristicCallbackUuids.includes(char.uuid)

        if (hasCallback) {
            this.setupCharacteristicOnDataHandler(char)
        }
    }

    private get characteristicCallbackUuids() {
        return Object.keys(this.characteristicCallbacks)
    }

    private setupCharacteristicOnDataHandler(char: Characteristic) {
        const callback = this.characteristicCallbacks?.[char.uuid]

        char.on('data', (data) => {
            callback(data, char)
        })
    }

    private throwCharacteristicSubscribeFailed(charUuid: string, err: unknown) {
        throw new Error(`
            \n Failed to subscribe to characteristicUuid: ${charUuid}!
            \n ${err}
        `)
    }

    private setupRssiIfEnabled() {
        if (this.rssiIntervalMs) {
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
        console.info(`RSSI (${this.localName}): ${rssi}`)
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
            console.warn(this.unintentionalDisconnectMessage)
            await this.reconnect()
        }
    }

    private teardownDisconnectHandler() {
        this.peripheral.off('disconnect', this.handleDisconnect)
    }

    private async reconnect() {
        console.info(this.reconnectingMessage)
        await this.connect()
        console.info(this.reconnectedMessage)
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
        } catch (err: unknown) {
            this.throwDisconnectFailed(err)
        }
    }

    private throwDisconnectFailed(err: unknown) {
        throw new Error(`
            \n Failed to disconnect from peripheral: ${this.localName}!
            \n ${err}
        `)
    }

    public getCharacteristic(charUuid: string) {
        return this.characteristics.find((c) => c.uuid === charUuid)
    }

    public get uuid() {
        return this.peripheral.uuid
    }

    public get name() {
        return this.localName
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
        return BleDeviceController.setInterval
    }
}

export interface BleController {
    connect(): Promise<void>
    disconnect(): Promise<void>
    getCharacteristic(charUuid: string): Characteristic | undefined
    uuid: string
    name: string
}

export interface BleControllerOptions {
    peripheral: Peripheral
    characteristicCallbacks: CharacteristicCallbacks
    rssiIntervalMs?: number
    shouldConnect?: boolean
}

export type BleControllerConstructor = new (
    options: BleControllerConstructorOptions
) => BleController

export interface BleControllerConstructorOptions {
    peripheral: Peripheral
    characteristicCallbacks: CharacteristicCallbacks
    rssiIntervalMs?: number
}

export type CharacteristicCallbacks = Record<
    CharacteristicUuid,
    (data: Buffer, characteristic: Characteristic) => void
>

export type CharacteristicUuid = string
