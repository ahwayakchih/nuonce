/* eslint strict: 0 */

'use strict';

module.exports = observable;

/**
 * Status object used by `{@link module:nuonce.observable}`.
 *
 * Set `cb` to null to stop "observing".
 *
 * @typedef {Object} module:nuonce.observableStatus
 * @property {number}   calls   number of times observed function was called
 * @property {any}      value   value returned by target function
 * @property {Function} cb      function to be called each time observed function is called
 */

/**
 * Looks and works just like `{@link module:nuonce.stripped}` with addition of callback,
 * that will be called every time the created "observed" function is called.
 *
 * Callback will recieve `{@link module:nuonce.observableStatus}` as its only argument.
 * It should return value that will be passed to the caller.
 *
 * You can nullify `status.cb` to stop "observing" (there will be no more call backs).
 *
 * @example
 * const nuonce = require('nuonce/observable');
 * function statistitian (status) {
 *   console.log(`Called ${status.calls} times.`);
 *   return status.value;
 * }
 * const run = nuonce(() => 1, statistitian);
 * for (let i = 0; i < 10; i++) {
 *   run();
 * }
 *
 * @example
 * const nuonce = require('nuonce/observable');
 * const once = nuonce(() => Math.random(), status => {
 *   if (status.calls > 1) throw new Error('Do not call this more than once');
 *   status.cb = null;
 *   once.called = status.calls;
 *   return once.value = status.value;
 * });
 * once() === once() || console.error('values differ');
 * once.called === 1 || console.error('observer called multiple times');
 * once.value === once() || console.error('stored value is different than returned one');
 *
 * @function
 * @memberof module:nuonce
 * @param {Function} fn
 * @param {Function} [cb]   call back once with result, right after first call
 * @return {Function}
 */
function observable (fn, cb) {
	if (typeof fn !== 'function') {
		throw new Error('argument must be a function');
	}

	if (cb && typeof cb !== 'function') {
		throw new Error('callback must be a function');
	}

	var status = {
		calls: 0,
		value: undefined, // eslint-disable-line no-undefined
		cb
	};

	/**
	 * @private
	 * @return {any} whatever was returned by cb
	 */
	return function _f () {
		if (fn) {
			// Use `...args` in future, when it's not so much slower than `arguments`.
			status.value = fn.apply(this, arguments); // eslint-disable-line no-invalid-this, prefer-rest-params

			// Free any references to the target function
			fn = null;
		}

		status.calls++;
		return status.cb ? status.cb(status) : status.value;
	};
}
