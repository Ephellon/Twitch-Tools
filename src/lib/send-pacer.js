/*** /lib/send-pacer.js
 * Paces outgoing chat messages so Twitch doesn't drop them or silently mute the sender.
 * Twitch allows 20 messages per 30 s (100 for moderators and the broadcaster); sends inside one
 * tick, or right behind another, get dropped. The pacer keeps a gap between sends and a
 * sliding-window cap, and queues the rest in order.
 */

/**
 * Creates a pacer.
 * @param {Object} [options]
 * @param {number} [options.gap=1100] - Least time between two sends, in ms
 * @param {number} [options.window=30000] - Length of the rate window, in ms
 * @param {function} [options.limit] - Returns the most sends allowed per window (checked on every send)
 * @param {function} [options.now] - Clock, for tests
 * @param {function} [options.later] - `setTimeout`, for tests
 * @param {function} [options.warn] - Reports a send that threw
 * @returns {{ push: function(function): void, readonly size: number }}
 */
export function createSendPacer({ gap = 1100, window = 30_000, limit = () => 20, now = () => Date.now(), later = (fn, ms) => setTimeout(fn, ms), warn = error => console.warn('[send-pacer]', error) } = {}) {
    const queue = [], sent = [];
    let timer = null;

    function drain() {
        timer = null;

        while(queue.length) {
            const time = now();

            while(sent.length && time - sent[0] >= window)
                sent.shift();

            const waitGap = sent.length ? sent[sent.length - 1] + gap - time : 0;
            const waitCap = sent.length >= limit() ? sent[sent.length - limit()] + window - time : 0;
            const wait = Math.max(waitGap, waitCap, 0);

            if(wait > 0)
                return void (timer = later(drain, wait));

            sent.push(time);

            try {
                queue.shift()();
            } catch(error) {
                warn(error);
            }
        }
    }

    return {
        push(send) {
            queue.push(send);

            if(timer === null)
                drain();
        },

        get size() {
            return queue.length;
        },
    };
}
