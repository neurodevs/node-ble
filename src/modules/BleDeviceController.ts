import { LibndxAdapter } from '@neurodevs/ndx-native'
import { Characteristic } from '../noble/importNobleCjs.js'

export default class BleDeviceController implements BleController {
    public static Class?: BleControllerConstructor
    public static setInterval = setInterval
    public static ndx = LibndxAdapter.getInstance()

    protected characteristicCallbacks: CharacteristicCallbacks
    protected rssiIntervalMs?: number
    protected log = console

    private deviceUuid: string

    protected constructor(options: BleControllerConstructorOptions) {
        const { deviceUuid, characteristicCallbacks, rssiIntervalMs } = options

        this.deviceUuid = deviceUuid
        this.characteristicCallbacks = characteristicCallbacks
        this.rssiIntervalMs = rssiIntervalMs
    }

    public static async Create(options: BleControllerOptions) {
        return new (this.Class ?? this)(options)
    }

    public async connect() {
        this.ndx.createBleBackend({ deviceUuid: this.uuid })
        this.ndx.startBleBackend({ deviceUuid: this.uuid })
    }

    public async disconnect() {
        this.ndx.destroyBleBackend({ deviceUuid: this.uuid })
    }

    public get uuid() {
        return this.deviceUuid
    }

    public get name() {
        return ''
    }

    private get ndx() {
        return BleDeviceController.ndx
    }
}

export interface BleController {
    connect(): Promise<void>
    disconnect(): Promise<void>
    uuid: string
    name: string
}

export interface BleControllerOptions {
    deviceUuid: string
    characteristicCallbacks: CharacteristicCallbacks
    rssiIntervalMs?: number
}

export type BleControllerConstructor = new (
    options: BleControllerConstructorOptions
) => BleController

export interface BleControllerConstructorOptions {
    deviceUuid: string
    characteristicCallbacks: CharacteristicCallbacks
    rssiIntervalMs?: number
}

export type CharacteristicCallbacks = Record<
    CharacteristicUuid,
    (data: Buffer, characteristic: Characteristic) => void
>

export type CharacteristicUuid = string
