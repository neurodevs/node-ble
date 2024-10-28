import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const deviceDisconnectFailedSchema: SpruceErrors.NodeBle.DeviceDisconnectFailedSchema  = {
	id: 'deviceDisconnectFailed',
	namespace: 'NodeBle',
	name: 'DEVICE_DISCONNECT_FAILED',
	    fields: {
	            /** . */
	            'localName': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(deviceDisconnectFailedSchema)

export default deviceDisconnectFailedSchema
