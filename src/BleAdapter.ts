import { assertOptions } from '@sprucelabs/schema'
import { Peripheral } from '@abandonware/noble'

export default class BleAdapterImpl implements BleAdapter {
    public static Class?: BleAdapterConstructor

    protected peripheral: Peripheral

    protected constructor(peripheral: Peripheral) {
        this.peripheral = peripheral
    }

    public static async Create(peripheral: Peripheral) {
        assertOptions({ peripheral }, ['peripheral'])
        await peripheral.connectAsync()

        return new (this.Class ?? this)(peripheral)
    }
}

export interface BleAdapter {}

export type BleAdapterConstructor = new (peripheral: Peripheral) => BleAdapter
