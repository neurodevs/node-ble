import AbstractModuleTest from '@neurodevs/node-tdd'

export default class AbstractPackageTest extends AbstractModuleTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }
}
