export const debug = {
    enabled: ['127.0.0.1', 'localhost'].includes(window.location.hostname),
    log(...args) {
        if (this.enabled) {
            console.log(...args);
        }
    }
};
