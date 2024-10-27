import { SchemaRegistry } from '@sprucelabs/schema'
import { SpruceErrors } from '../errors.types'



const scanTimedOutSchema: SpruceErrors.NodeBle.ScanTimedOutSchema  = {
	id: 'scanTimedOut',
	namespace: 'NodeBle',
	name: 'SCAN_TIMED_OUT',
	    fields: {
	            /** . */
	            'timeoutMs': {
	                type: 'number',
	                isRequired: true,
	                options: undefined
	            },
	            /** . */
	            'uuids': {
	                type: 'text',
	                isArray: true,
	                options: undefined
	            },
	            /** . */
	            'names': {
	                type: 'text',
	                isArray: true,
	                options: undefined
	            },
	    }
}

SchemaRegistry.getInstance().trackSchema(scanTimedOutSchema)

export default scanTimedOutSchema
