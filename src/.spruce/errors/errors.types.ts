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


export declare namespace SpruceErrors.NodeBle {

	
	export interface DeviceDisconnectFailed {
		
			
			'localName': string
	}

	export interface DeviceDisconnectFailedSchema extends SpruceSchema.Schema {
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

	export type DeviceDisconnectFailedEntity = SchemaEntity<SpruceErrors.NodeBle.DeviceDisconnectFailedSchema>

}


export declare namespace SpruceErrors.NodeBle {

	
	export interface CharacteristicSubscribeFailed {
		
			
			'characteristicUuid': string
	}

	export interface CharacteristicSubscribeFailedSchema extends SpruceSchema.Schema {
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

	export type CharacteristicSubscribeFailedEntity = SchemaEntity<SpruceErrors.NodeBle.CharacteristicSubscribeFailedSchema>

}




