import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'characteristicSubscribeFailed',
    name: 'CHARACTERISTIC_SUBSCRIBE_FAILED',
    fields: {
        characteristicUuid: {
            type: 'text',
            isRequired: true,
        },
    },
})
