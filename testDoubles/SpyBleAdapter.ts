import { Peripheral } from '@abandonware/noble'
import BleAdapterImpl from '../BleAdapter'

export default class SpyBleAdapter extends BleAdapterImpl {
    public constructor(peripheral: Peripheral) {
        super(peripheral)
    }

    public getPeripheral() {
        return this.peripheral
    }
}
