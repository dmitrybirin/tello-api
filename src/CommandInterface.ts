import * as dgram from 'dgram';
import { logger, DeferredPromise, defer } from './utils';

enum commandStatus {
    error = 'error',
    ok = 'ok',
    inProgress = 'inProgress',
}

interface Command {
    startTime: number;
    command: string;
    endTime?: number;
    response?: string;
    status: commandStatus;
    deferredPromise: DeferredPromise<string>;
}

export class CommandInterface {
    private commandPort: number;
	private host: string;
	private defaultCommandTimeout: number = 10000;
    public commandSocket: dgram.Socket = dgram.createSocket('udp4');

    constructor(commandPort: number, host: string, defaultCommandTimeout?: number) {
        this.commandPort = commandPort;
		this.host = host;
		if (defaultCommandTimeout) this.defaultCommandTimeout = defaultCommandTimeout;
    }

    private handleSendingError = (err: Error | null) => {
        if (err) {
            console.error(err);
        }
    };

    public async init() {
        this.commandSocket.bind(this.commandPort);
        this.commandSocket.on('error', (err) => {
            this.onError(`${err}`);
        });

        this.commandSocket.on('message', (msg, rinfo) => {
            this.onMessage(msg.toString());
            logger.debug(`🚁: ${msg} ${new Date().toTimeString()}`);
		});
		
		await this.executeCommand('command')
    }

    public commands: Command[] = [];

    public async executeCommand(command: string, commandTimeout?: number): Promise<string>{
        logger.info(`💻 command: ${command}`);
        const [currentCommand] = this.commands;
        if (currentCommand?.status !== commandStatus.inProgress) {
			try {
				const deferredPromise = defer<string>(commandTimeout || this.defaultCommandTimeout);
				this.commands = [
					{
						command,
						startTime: +new Date(),
						status: commandStatus.inProgress,
						deferredPromise,
					},
					...this.commands,
				];
	
				this.commandSocket.send(
					command,
					this.commandPort,
					this.host,
					(err) => this.handleSendingError(err)
				);
				return deferredPromise.promise;
			} catch (err) {
				console.log('catche mfkr')
				this.onError(err)
				throw err
			}
          
        } else {
            logger.error(
                `Command ${command} will not be executed, ${currentCommand.command} still in progress`
			);
			return Promise.resolve('not executed')
        }
    }

    public onError(error: string): void {
        logger.error(`🚁: ${error}`);
        const [currentCommand, ...restOfCommands] = this.commands;
        if (currentCommand.status === commandStatus.inProgress) {
			if(currentCommand.deferredPromise?.timeout) clearTimeout(currentCommand.deferredPromise.timeout)
            currentCommand.deferredPromise.reject(new Error(error))
            this.commands = [
                {
                    ...currentCommand,
                    endTime: +new Date(),
                    status: commandStatus.error,
                    response: error,
                },
                ...restOfCommands,
            ];
        }
    }

    public onMessage(message: string): void {
        const [currentCommand, ...restOfCommands] = this.commands;
        if (currentCommand.status === commandStatus.inProgress) {
			if(currentCommand.deferredPromise?.timeout) clearTimeout(currentCommand.deferredPromise.timeout)
			currentCommand.deferredPromise.resolve(message)
            this.commands = [
                {
                    ...currentCommand,
                    endTime: +new Date(),
                    status:
                        message === 'error'
                            ? commandStatus.error
                            : commandStatus.ok,
                    response: message,
                },
                ...restOfCommands,
            ];
        }
        this.commands = [
            {
                ...currentCommand,
                endTime: +new Date(),
                status: commandStatus.error,
            },
            ...restOfCommands,
        ];
    }

    public close() {
        this.commandSocket.removeAllListeners();
    }
}
