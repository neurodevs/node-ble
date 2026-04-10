import { FakeLibndx, LibndxAdapter } from '@neurodevs/ndx-native'
import AbstractModuleTest from '@neurodevs/node-tdd'
import BleDeviceController from '../modules/BleDeviceController.js'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static fakeLibndx: FakeLibndx

    protected static async beforeEach() {
        await super.beforeEach()

        this.setFakeLibndx()
    }

    protected static setFakeLibndx() {
        this.fakeLibndx = new FakeLibndx()
        LibndxAdapter.setInstance(this.fakeLibndx)

        BleDeviceController.ndx = this.fakeLibndx
    }
}
