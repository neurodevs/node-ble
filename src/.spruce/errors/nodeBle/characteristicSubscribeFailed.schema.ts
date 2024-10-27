import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const characteristicSubscribeFailedSchema: SpruceErrors.NodeBle.CharacteristicSubscribeFailedSchema  = {
	id: 'characteristicSubscribeFailed',
	namespace: 'NodeBle',
	name: 'CHARACTERISTIC_SUBSCRIBE_FAILED',
	    fields: {
	            /** . */
	            'characteristicUuid': {
	                type: 'text',
	                isRequired: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(characteristicSubscribeFailedSchema)

export default characteristicSubscribeFailedSchema
