import BaseSpruceError from '@sprucelabs/error'
import ErrorOptions, {
    ScanTimedOutErrorOptions,
    CharacteristicSubscribeFailedErrorOptions,
    DeviceDisconnectFailedErrorOptions,
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

            case 'CHARACTERISTIC_SUBSCRIBE_FAILED':
                message = this.generateSubscribeFailedMessage(options)
                break

            case 'DEVICE_DISCONNECT_FAILED':
                message = this.generateDisconnectFailedMessage(options)
                break

            default:
                message = super.friendlyMessage()
        }

        const fullMessage = options.friendlyMessage
            ? options.friendlyMessage
            : message

        return fullMessage
    }

    private generateSubscribeFailedMessage(
        options: CharacteristicSubscribeFailedErrorOptions
    ) {
        const { characteristicUuid, originalError } = options ?? {}
        return `
            \n Failed to subscribe to peripheral characteristic: ${characteristicUuid}!
            \n Original error: ${originalError}
        `
    }

    private generateDisconnectFailedMessage(
        options: DeviceDisconnectFailedErrorOptions
    ) {
        const { localName } = options ?? {}

        return `
            \n Failed to disconnect from peripheral: ${localName}!
            \n Original error: ${this.originalError}
        `
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
