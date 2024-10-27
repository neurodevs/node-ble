import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface ScanTimedOutErrorOptions extends SpruceErrors.NodeBle.ScanTimedOut, ISpruceErrorOptions {
	code: 'SCAN_TIMED_OUT'
}
export interface CharacteristicSubscribeFailedErrorOptions extends SpruceErrors.NodeBle.CharacteristicSubscribeFailed, ISpruceErrorOptions {
	code: 'CHARACTERISTIC_SUBSCRIBE_FAILED'
}

type ErrorOptions =  | ScanTimedOutErrorOptions  | CharacteristicSubscribeFailedErrorOptions 

export default ErrorOptions
