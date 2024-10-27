import { SpruceErrors } from "#spruce/errors/errors.types"
import { ErrorOptions as ISpruceErrorOptions} from "@sprucelabs/error"

export interface ScanTimedOutErrorOptions extends SpruceErrors.NodeBle.ScanTimedOut, ISpruceErrorOptions {
	code: 'SCAN_TIMED_OUT'
}

type ErrorOptions =  | ScanTimedOutErrorOptions 

export default ErrorOptions
