import * as dgram from 'dgram';
import { logger, DeferredPromise, defer } from './utils';
import { CommandStatus, InterfaceStatus, CommandResult } from './types';

enum CommandType {
    action = 'action', // answer ok/error,
    info = 'info', // answer is info/error
}

interface Command {
    startTime: number;
    command: string;
    endTime?: number;
    response?: string;
    status: CommandStatus;
    type: CommandType;
    deferredPromise: DeferredPromise<string>;
}

export class CommandInterface {
    public status: InterfaceStatus = InterfaceStatus.initial;
    public clientPort = 9888;
    public targetPort: number;
    public targetHost: string;
    public commandSocket: dgram.Socket = dgram.createSocket('udp4');
    public commands: Command[] = [];

    private defaultCommandTimeout = 10000;

    constructor(targetPort: number, targetHost: string, clientPort?: number, defaultCommandTimeout?: number) {
        this.targetPort = targetPort;
        this.targetHost = targetHost;

        if (clientPort === 0 || clientPort) this.clientPort = clientPort;
        this.commandSocket.bind(this.clientPort);

        if (defaultCommandTimeout) this.defaultCommandTimeout = defaultCommandTimeout;
    }

    private createCommandErrorResult(rawMessage: string | null, errorMessage: string, rawError?: Error): CommandResult {
        logger.error(`🚁😢${errorMessage}`);

        const commonMessage = {
            status: CommandStatus.error,
            message: rawMessage,
            errorMessage,
        };

        if (rawError) {
            return { ...commonMessage, exception: rawError };
        } else {
            return commonMessage;
        }
    }

    private onSocketError(error: string): void {
        logger.error(`💻: socket error: ${error}`);
        this.status = InterfaceStatus.failed;

        // TODO probably should reinit the connection
    }

    private onMessage(message: string): void {
        const [currentCommand, ...restOfCommands] = this.commands;
        if (currentCommand.status === CommandStatus.inProgress) {
            if (currentCommand.deferredPromise?.timeout) clearTimeout(currentCommand.deferredPromise.timeout);
            currentCommand.deferredPromise.resolve(message);
            this.commands = [
                {
                    ...currentCommand,
                    endTime: +new Date(),
                    status: message === 'error' ? CommandStatus.error : CommandStatus.ok,
                    response: message,
                },
                ...restOfCommands,
            ];
        }
    }

    public async init(): Promise<CommandResult> {
        try {
            this.commandSocket.once('listening', () => {
                const port = this.commandSocket.address().port;
                this.clientPort = port;
                logger.debug(`💻 listening on ${port}`);
            });

            this.commandSocket.on('error', (err) => {
                this.onSocketError(err?.message || 'unknown error');
            });

            this.commandSocket.on('message', (msg) => {
                logger.debug(`🚁: ${msg} ${new Date().toTimeString()}`);
                this.onMessage(msg.toString());
            });

            const result = await this.executeCommand('command');

            if (result.status === CommandStatus.ok) {
                if (result.message === 'ok') {
                    this.status = InterfaceStatus.ready;
                    return {
                        status: CommandStatus.ok,
                        message: 'Drone is ready to recieve commands',
                    };
                } else {
                    this.status = InterfaceStatus.failed;
                    const errorMessage = `Drone is not ready to recieve commands. Command 'command' returned '${result.message}'.`;
                    return this.createCommandErrorResult(result.message, errorMessage);
                }
            }

            if (result.status === CommandStatus.error) {
                this.status = InterfaceStatus.failed;
                const { exception, errorMessage: originalErrorMessage } = result;
                const errorMessage = `Drone is not ready to recieve commands. ${originalErrorMessage}`;
                return this.createCommandErrorResult(result.message, errorMessage, exception);
            }

            this.status = InterfaceStatus.failed;
            const errorMessage = `Drone is not ready to recieve commands: Unknown status ${result.status}`;
            return this.createCommandErrorResult(null, errorMessage);
        } catch (err) {
            this.status = InterfaceStatus.failed;
            const errorMessage = `Drone is not ready to recieve commands: ${err?.message || 'no message'}`;
            return this.createCommandErrorResult(null, errorMessage, err);
        }
    }

    public async executeCommand(command: string, commandTimeout?: number): Promise<CommandResult> {
        logger.info(`💻 command: ${command}`);

        if (this.status === InterfaceStatus.ready || command === 'command') {
            const [currentCommand] = this.commands;
            if (!currentCommand || currentCommand?.status !== CommandStatus.inProgress) {
                try {
                    const commandType =
                        command.indexOf('?') === command.length - 1 ? CommandType.info : CommandType.action;
                    const deferredPromise = defer<string>(commandTimeout || this.defaultCommandTimeout);
                    this.commands = [
                        {
                            command,
                            startTime: +new Date(),
                            type: commandType,
                            status: CommandStatus.inProgress,
                            deferredPromise,
                        },
                        ...this.commands,
                    ];

                    this.commandSocket.send(command, this.targetPort, this.targetHost, (err) => {
                        if (err) throw err;
                    });

                    const result = await deferredPromise.promise;

                    if (result === 'error') {
                        const errorMessage = `Command '${command}' returned 'error'`;
                        return this.createCommandErrorResult(result, errorMessage);
                    }

                    if (commandType === CommandType.action && result !== 'ok') {
                        const errorMessage = `Command '${command}' returned '${result}'. Should be only ok/error`;
                        return this.createCommandErrorResult(result, errorMessage);
                    }

                    return {
                        status: CommandStatus.ok,
                        message: result,
                    };
                } catch (err) {
                    this.commands = [
                        {
                            ...currentCommand,
                            endTime: +new Date(),
                            status: CommandStatus.error,
                        },
                        ...this.commands,
                    ];
                    const errorMessage = `Command '${command}' failed cause of exception: ${
                        err?.message || 'unknown message'
                    }`;
                    return this.createCommandErrorResult(null, errorMessage, err);
                }
            } else {
                const errorMessage = `Command ${command} will not be executed, ${currentCommand.command} still in progress`;
                return this.createCommandErrorResult(null, errorMessage);
            }
        } else {
            if (this.status === InterfaceStatus.failed) {
                const errorMessage = `Interface is in failed status, please reinit`;
                return this.createCommandErrorResult(null, errorMessage);
            }

            if (this.status === InterfaceStatus.initial) {
                const errorMessage = `Interface is in the initial status, please init to send commands`;
                return this.createCommandErrorResult(null, errorMessage);
            }

            const errorMessage = `Interface is in the unknown status, please try to reinit`;
            return this.createCommandErrorResult(null, errorMessage);
        }
    }

    public close(): void {
        this.commandSocket.unref();
        this.commandSocket.removeAllListeners();
    }
}
