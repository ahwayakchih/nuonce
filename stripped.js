/* eslint strict: 0 */

'use strict';

module.exports = stripped;

/**
 * Returns a function that will call the `fn` function just once.
 * Every next time the returned function is called, it will return value from the first call.
 *
 * The returned function does not keep properties or `length` of target function. If you need
 * such decorations and/or specific `length`, use the `{@link module:nuonce.copied}` method instead.
 *
 * @example
 * const nuonce = require('nuonce/stripped');
 * function worker (id, win) {
 *   setTimeout(() => win(id), Math.floor(Math.random() * 100));
 * }
 * function raceToWin (callback) {
 *   const win = nuonce(callback);
 *   // Whichever asynchronous worker calls `win` first, will call back.
 *   // Any other worker will be ignored.
 *   worker(1, win);
 *   worker(2, win);
 *   worker(3, win);
 * }
 * function announceWinner (id) {
 *   console.log(`${id} won the race!`);
 * }
 * raceToWin(announceWinner);
 *
 * @function
 * @memberof module:nuonce
 * @param {Function} fn
 * @return {Function}
 */
function stripped (fn) {
	if (typeof fn !== 'function') {
		throw new Error('argument must be a function');
	}

	var r;

	/**
	 * @private
	 * @return {any} whatever was returned by cb
	 */
	return function _f () {
		if (fn) {
			// Use `...args` in future, when it's not so much slower than `arguments`.
			r = fn.apply(this, arguments); // eslint-disable-line no-invalid-this,prefer-rest-params

			// Free any references to the target function
			fn = null;
		}

		return r;
	};
}
