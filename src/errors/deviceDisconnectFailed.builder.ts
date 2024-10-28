import { buildErrorSchema } from '@sprucelabs/schema'

export default buildErrorSchema({
    id: 'deviceDisconnectFailed',
    name: 'DEVICE_DISCONNECT_FAILED',
    fields: {
        localName: {
            type: 'text',
            isRequired: true,
        },
    },
})
