export interface DeferredPromise<T> {
    promise: Promise<T>;
    resolve: (value?: T) => void;
    reject: (err?: Error) => void;
    timeout?: NodeJS.Timeout;
}

export const wait = async (ms: number): Promise<void> => new Promise((res) => setTimeout(res, ms));

export const defer = <T>(timeoutIn?: number): DeferredPromise<T> => {
    const deferred: Partial<DeferredPromise<T>> = {};

    deferred.promise = new Promise((resolve, reject) => {
        deferred.resolve = resolve;
        deferred.reject = reject;
    });

    if (timeoutIn) {
        deferred.timeout = setTimeout(() => deferred.reject?.(new Error(`timeout after ${timeoutIn} ms`)), timeoutIn);
    }

    return deferred as DeferredPromise<T>;
};

export const logger = {
    debug: (message: string): void => {
        if (process.env.DEBUG) console.log(message);
    },
    info: (message: string): void => console.log(message),
    error: (message: string): void => console.error(message),
};
