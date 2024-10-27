import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions, {
    ScanTimedOutErrorOptions,
} from '#spruce/errors/options.types'

export default class SpruceError extends BaseSpruceError<ErrorOptions> {
    /** an easy to understand version of the errors */
    public friendlyMessage(): string {
        const { options } = this
        let message
        switch (options?.code) {
            case 'SCAN_TIMED_OUT':
                message = this.generateTimedOutMessage(options)
                break
            default:
                message = super.friendlyMessage()
        }

        const fullMessage = options.friendlyMessage
            ? options.friendlyMessage
            : message

        return fullMessage
    }

    private generateTimedOutMessage(options: ScanTimedOutErrorOptions) {
        const { timeoutMs, names = [], uuids = [] } = options ?? {}

        return `
            \n Scan timed out after ${timeoutMs} ms! 
            ${this.generateUuidsMessage(uuids)} 
            ${this.generatedNamesMessage(names)}
        `
    }

    private generatedNamesMessage(names: string[] | null) {
        return names && names.length > 0
            ? '\n Failed to discover all names: ' + names.join(', ')
            : ''
    }

    private generateUuidsMessage(uuids: string[] | null) {
        return uuids && uuids.length > 0
            ? '\n Failed to discover all uuids: ' + uuids.join(', ')
            : ''
    }
}
