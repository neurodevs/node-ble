import AbstractSpruceTest from '@sprucelabs/test-utils'

export default class AbstractPackageTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }
}
