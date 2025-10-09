import AbstractSpruceTest from '@sprucelabs/test-utils'
import generateId from '@neurodevs/generate-id'

export default class AbstractPackageTest extends AbstractSpruceTest {
    protected static async beforeEach() {
        await super.beforeEach()
    }

    protected static generateId() {
        return generateId()
    }
}
