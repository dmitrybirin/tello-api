import * as dgram from 'dgram'
import { logger, DeferredPromise, defer } from './utils'
import { CommandStatus } from './types'


// enum InterfaceStatus {
//     ready = 'ready', // ready to new command
//     socketReady = 'socket_ready', // connection established
//     failed = 'failed' // unrecovered failure
// }

enum CommandType {
    action = 'action', // answer ok/error,
    info = 'info' // answer is info/error
}

interface Command {
    startTime: number
    command: string
    endTime?: number
    response?: string
    status: CommandStatus
    type: CommandType,
    deferredPromise: DeferredPromise<string>
}

interface CommandResult {
    status: CommandStatus
    message: string | null
    errorMessage?: string
    exception?: Error
}

export class CommandInterface {
    public commandPort: number
    public host: string
    public commandSocket: dgram.Socket = dgram.createSocket('udp4')
    public commands: Command[] = []

    private defaultCommandTimeout: number = 10000

    constructor(commandPort: number, host: string, defaultCommandTimeout?: number) {
        this.commandPort = commandPort
        this.host = host
        if (defaultCommandTimeout) this.defaultCommandTimeout = defaultCommandTimeout
    }

    private createCommandErrorResult(rawMessage: string | null, errorMessage: string, rawError?: Error): CommandResult {
        logger.error(`🚁😢${errorMessage}`)
        
        const commonMessage = {
            status: CommandStatus.error,
            message: rawMessage,
            errorMessage,
        }

        if (rawError) {
            return {...commonMessage, exception: rawError}
        } else {
            return commonMessage
        }

    }

    private onSocketError(error: string): void {
        logger.error(`💻: socket error: ${error}`)
        // TODO probably should reinit the connection
    }

    private onMessage(message: string): void {
        const [currentCommand, ...restOfCommands] = this.commands
        if (currentCommand.status === CommandStatus.inProgress) {
            if (currentCommand.deferredPromise?.timeout)
                clearTimeout(currentCommand.deferredPromise.timeout)
            currentCommand.deferredPromise.resolve(message)
            this.commands = [
                {
                    ...currentCommand,
                    endTime: +new Date(),
                    status: message === 'error' ? CommandStatus.error : CommandStatus.ok,
                    response: message,
                },
                ...restOfCommands,
            ]
        }
        this.commands = [
            {
                ...currentCommand,
                endTime: +new Date(),
                status: CommandStatus.error,
            },
            ...restOfCommands,
        ]
    }

    public async init(): Promise<CommandResult> {
        try {

            this.commandSocket.on('error', (err) => {
                logger.debug(`🚁 🔴: ${err} ${new Date().toTimeString()}`)
                this.onSocketError(err?.message || 'unknown error')
            })

            this.commandSocket.on('message', (msg, rinfo) => {
                logger.debug(`🚁: ${msg} ${new Date().toTimeString()}`)
                this.onMessage(msg.toString())
            })

            const result = await this.executeCommand('command')
            
            if (result.status === CommandStatus.ok) {
                if (result.message === 'ok') {
                    return {
                        status: CommandStatus.ok,
                        message: 'Drone is ready to recieve commands',
                    }
                } else {
                    const errorMessage = `Drone is not ready to recieve commands. Command 'command' returned '${result.message}'.`
                    return this.createCommandErrorResult(result.message, errorMessage)
                }
            }
            
            if (result.status === CommandStatus.error) {
                const {exception, errorMessage: originalErrorMessage} = result
                const errorMessage = `Drone is not ready to recieve commands. ${originalErrorMessage}`
                    return this.createCommandErrorResult(result.message, errorMessage, exception)
            }

            const errorMessage = `Drone is not ready to recieve commands: Unknown status ${result.status}`
            return this.createCommandErrorResult(null, errorMessage)
            
        } catch (err) {
            const errorMessage = `Drone is not ready to recieve commands: ${err?.message || 'no message'}`
            return this.createCommandErrorResult(null, errorMessage, err)
        }
    }

    public async executeCommand(command: string, commandTimeout?: number): Promise<CommandResult> {
        logger.info(`💻 command: ${command}`)
        const [currentCommand] = this.commands
        if (!currentCommand || currentCommand?.status !== CommandStatus.inProgress) {
            try {
                const commandType = command.indexOf('?') === command.length-1 ? CommandType.info : CommandType.action
                const deferredPromise = defer<string>(commandTimeout || this.defaultCommandTimeout)
                this.commands = [
                    {
                        command,
                        startTime: +new Date(),
                        type: commandType,
                        status: CommandStatus.inProgress,
                        deferredPromise,
                    },
                    ...this.commands,
                ]

                this.commandSocket.send(command, this.commandPort, this.host, (err) => {
                    if (err) throw err
                })

                const result = await deferredPromise.promise

                if (result === 'error') {
                    const errorMessage = `Command '${command}' returned 'error'`
                    return this.createCommandErrorResult(result, errorMessage)
                }

                if(commandType === CommandType.action && result!== 'ok') {
                    const errorMessage = `Command '${command}' returned '${result}'. Should be only ok/error`
                    return this.createCommandErrorResult(result, errorMessage)
                }

                return {
                    status: CommandStatus.ok,
                    message: result,
                }
            } catch (err) {
                const errorMessage = `Command '${command}' failed cause of exception: ${err?.message || 'unknown message'}`
                return this.createCommandErrorResult(null, errorMessage, err)
            }
        } else {
            const errorMessage = `Command ${command} will not be executed, ${currentCommand.command} still in progress`
            return this.createCommandErrorResult(null ,errorMessage)
        }
    }

    public close() {
        this.commandSocket.unref()
        this.commandSocket.removeAllListeners()
    }
}
