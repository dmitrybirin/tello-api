import * as dgram from 'dgram'
import { logger, DeferredPromise, defer } from './utils'

enum commandStatus {
    error = 'error',
    ok = 'ok',
    inProgress = 'inProgress',
}

interface Command {
    startTime: number
    command: string
    endTime?: number
    response?: string
    status: commandStatus
    deferredPromise: DeferredPromise<string>
}

interface CommandResult {
    status: commandStatus
    message: string
}

export class CommandInterface {
    private commandPort: number
    private host: string
    private defaultCommandTimeout: number = 10000
    public commandSocket: dgram.Socket = dgram.createSocket('udp4')

    constructor(commandPort: number, host: string, defaultCommandTimeout?: number) {
        this.commandPort = commandPort
        this.host = host
        if (defaultCommandTimeout) this.defaultCommandTimeout = defaultCommandTimeout
    }

    private handleSendingError = (err: Error | null) => {
        if (err) {
            console.error(err)
        }
    }

    public async init(): Promise<CommandResult> {
        try {
            this.commandSocket.on('error', (err) => {
                logger.debug(`🚁 🔴: ${err} ${new Date().toTimeString()}`)
                this.onError(`${err}`)
            })

            this.commandSocket.on('message', (msg, rinfo) => {
                if (rinfo.address !== this.host && rinfo.port !== this.commandPort) {
                    this.onMessage(msg.toString())
                    logger.debug(`🚁: ${msg} ${new Date().toTimeString()}`)
                }
            })

            this.commandSocket.on('listening', () => {
                const address = this.commandSocket.address()
                console.log(`server listening ${address.address}:${address.port}`)
            })

            this.commandSocket.bind(this.commandPort)

            const result = await this.executeCommand('command')
            if (result.message === 'ok') {
                return {
                    status: commandStatus.ok,
                    message: 'Drone is ready to recieve commands',
                }
            } else {
                console.log(result)
                return {
                    status: commandStatus.ok,
                    message: 'WTF',
                }
            }
        } catch (e) {
            return {
                status: commandStatus.error,
                message: 'Drone is ready to recieve commands',
            }
        }
    }

    public commands: Command[] = []

    public async executeCommand(command: string, commandTimeout?: number): Promise<CommandResult> {
        logger.info(`💻 command: ${command}`)
        const [currentCommand] = this.commands
        if (!currentCommand || currentCommand?.status !== commandStatus.inProgress) {
            try {
                const deferredPromise = defer<string>(commandTimeout || this.defaultCommandTimeout)
                this.commands = [
                    {
                        command,
                        startTime: +new Date(),
                        status: commandStatus.inProgress,
                        deferredPromise,
                    },
                    ...this.commands,
                ]

                this.commandSocket.send(command, this.commandPort, this.host, (err) =>
                    this.handleSendingError(err)
                )
                try {
                    const result = await deferredPromise.promise
                    return {
                        status: commandStatus.ok,
                        message: result,
                    }
                } catch (commandError) {
                    return {
                        status: commandStatus.error,
                        message: commandError,
                    }
                }
            } catch (err) {
                this.onError(err)
                throw err
            }
        } else {
            logger.error(
                `Command ${command} will not be executed, ${currentCommand.command} still in progress`
            )
            return {
                status: commandStatus.error,
                message: `Command ${command} will not be executed, ${currentCommand.command} still in progress`,
            }
        }
    }

    public onError(error: string): void {
        logger.error(`🚁: ${error}`)
        const [currentCommand, ...restOfCommands] = this.commands
        if (currentCommand.status === commandStatus.inProgress) {
            if (currentCommand.deferredPromise?.timeout)
                clearTimeout(currentCommand.deferredPromise.timeout)
            currentCommand.deferredPromise.reject(new Error(error))
            this.commands = [
                {
                    ...currentCommand,
                    endTime: +new Date(),
                    status: commandStatus.error,
                    response: error,
                },
                ...restOfCommands,
            ]
        }
    }

    public onMessage(message: string): void {
        const [currentCommand, ...restOfCommands] = this.commands
        if (currentCommand.status === commandStatus.inProgress) {
            if (currentCommand.deferredPromise?.timeout)
                clearTimeout(currentCommand.deferredPromise.timeout)
            currentCommand.deferredPromise.resolve(message)
            this.commands = [
                {
                    ...currentCommand,
                    endTime: +new Date(),
                    status: message === 'error' ? commandStatus.error : commandStatus.ok,
                    response: message,
                },
                ...restOfCommands,
            ]
        }
        this.commands = [
            {
                ...currentCommand,
                endTime: +new Date(),
                status: commandStatus.error,
            },
            ...restOfCommands,
        ]
    }

    public close() {
        this.commandSocket.unref()
        this.commandSocket.removeAllListeners()
    }
}
