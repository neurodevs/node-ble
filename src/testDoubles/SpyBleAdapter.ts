import BleAdapterImpl, { BleAdapterOptions } from '../BleAdapter'

export default class SpyBleAdapter extends BleAdapterImpl {
    public constructor(options: BleAdapterOptions) {
        super(options)
    }

    public getPeripheral() {
        return this.peripheral
    }
}
