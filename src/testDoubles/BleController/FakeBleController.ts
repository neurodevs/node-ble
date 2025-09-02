import { generateId } from '@sprucelabs/test-utils'
import { Characteristic } from '@abandonware/noble'
import {
    BleController,
    BleControllerConstructorOptions,
} from '../../modules/BleDeviceController'

export default class FakeBleController implements BleController {
    public static callsToConstructor: (
        | BleControllerConstructorOptions
        | undefined
    )[] = []

    public static numCallsToConnect = 0
    public static numCallsToDisconnect = 0
    public static callsToGetCharacteristic: string[] = []

    public static fakeCharacteristics: Record<string, Characteristic> = {}

    private _uuid: string
    private _name: string

    public constructor(options?: BleControllerConstructorOptions) {
        const { peripheral } = options ?? {}
        const { uuid, advertisement } = peripheral ?? {}
        const { localName } = advertisement ?? {}

        this._uuid = uuid ?? generateId()
        this._name = localName ?? generateId()

        FakeBleController.callsToConstructor.push(options)
    }

    public async connect() {
        FakeBleController.numCallsToConnect++
    }

    public async disconnect() {
        FakeBleController.numCallsToDisconnect++
    }

    public getCharacteristic(uuid: string) {
        this.callsToGetCharacteristic.push(uuid)
        return this.fakeCharacteristics?.[uuid]
    }

    public get uuid() {
        return this._uuid
    }

    public get name() {
        return this._name
    }

    private get callsToGetCharacteristic() {
        return FakeBleController.callsToGetCharacteristic
    }

    private get fakeCharacteristics() {
        return FakeBleController.fakeCharacteristics
    }

    public static resetTestDouble() {
        this.callsToConstructor = []
        this.numCallsToConnect = 0
        this.numCallsToDisconnect = 0
        this.callsToGetCharacteristic = []
    }
}

export interface CallToBleControllerConstructor {
    options: BleControllerConstructorOptions
}
