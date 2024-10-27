import { default as SchemaEntity } from '@sprucelabs/schema'
import * as SpruceSchema from '@sprucelabs/schema'





export declare namespace SpruceErrors.NodeBle {

	
	export interface ScanTimedOut {
		
			
			'timeoutMs': number
			
			'uuids'?: string[]| undefined | null
			
			'names'?: string[]| undefined | null
	}

	export interface ScanTimedOutSchema extends SpruceSchema.Schema {
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

	export type ScanTimedOutEntity = SchemaEntity<SpruceErrors.NodeBle.ScanTimedOutSchema>

}




