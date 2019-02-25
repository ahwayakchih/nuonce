/* eslint strict: 0 */

'use strict';

module.exports = proxied;

/**
 * Proxy
 *
 * @external Proxy
 * @see {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy}
 */

/**
 * Returns a callable Proxy object that will call the `fn` function just once.
 * Every next time the returned object is called, it will return value from the first call.
 *
 * The returned Proxy object points to target `fn` function.
 *
 * @example
 * const nuonce = require('nuonce/proxied');
 * let i = 0;
 * const f = () => ++i;
 * f.myProp = 'original';
 * const once = nuonce(f);
 * once() === once() || console.error('values differ');
 * f.myProp = 'changed';
 * once.myProp === 'changed' || console.error('proxied property differs from original');
 *
 * @function
 * @memberof module:nuonce
 * @param {Function} fn
 * @param {Function} [cb]   call back once with result, right after first call
 * @return {external:Proxy}
 */
function proxied (fn, cb) {
	if (typeof fn !== 'function') {
		throw new Error('argument must be a function');
	}

	if (cb && typeof cb !== 'function') {
		throw new Error('callback must be a function');
	}

	var status = {
		calls: 0,
		value: undefined,
		cb
	};

	return new Proxy(fn, {
		apply: function (_, ctx, args) {
			if (fn) {
				status.value = _.apply(ctx, args);
				fn = null;
			}

			status.calls++;
			return status.cb ? status.cb(status) : status.value;
		},
		construct: function (_, args) {
			if (fn) {
				status.value = new _(...args);
				fn = null;
			}

			status.calls++;
			return status.cb ? status.cb(status) : status.value;
		}
	});
}
