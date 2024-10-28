import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface ScanTimedOutErrorOptions extends SpruceErrors.NodeBle.ScanTimedOut, ISpruceErrorOptions {
	code: 'SCAN_TIMED_OUT'
}
export interface DeviceDisconnectFailedErrorOptions extends SpruceErrors.NodeBle.DeviceDisconnectFailed, ISpruceErrorOptions {
	code: 'DEVICE_DISCONNECT_FAILED'
}
export interface CharacteristicSubscribeFailedErrorOptions extends SpruceErrors.NodeBle.CharacteristicSubscribeFailed, ISpruceErrorOptions {
	code: 'CHARACTERISTIC_SUBSCRIBE_FAILED'
}

type ErrorOptions =  | ScanTimedOutErrorOptions  | DeviceDisconnectFailedErrorOptions  | CharacteristicSubscribeFailedErrorOptions 

export default ErrorOptions
