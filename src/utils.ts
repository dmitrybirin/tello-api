export interface DeferredPromise<T> {
		promise: Promise<T>,
		resolve: (value?: T) => void,
		reject: (err?: Error) => void
}

export const wait = async (ms:number): Promise<void> => new Promise(res => setTimeout(res, ms))

export const defer = <T>(): DeferredPromise<T> => {
	const deferred: Partial<DeferredPromise<T>> = {};

	deferred.promise = new Promise((resolve, reject) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});

	return deferred as DeferredPromise<T>;
}

export const logger = {
	debug: (message: string) => process.env.DEBUG && console.log(message),
	info: (message: string) => console.log(message),
	error: (message: string) => console.error(message)
}

