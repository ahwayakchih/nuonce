/* eslint strict: 0 */

'use strict';

module.exports = copied;

/**
 * List of `stripped` versions for different lengths of arguments.
 *
 * @private
 * @type {Function[]}
 */
var _stripped = [
	require('./stripped.js')
];

/**
 * List of `stripped` versions for different lengths of arguments.
 *
 * @private
 * @type {Function[]}
 */
var _observable = [
	require('./observable.js')
];

/**
 * Source code cache of the `stripped` function for faster creation of different lengths variations.
 *
 * @private
 */
_stripped.code = _stripped[0].toString()
	// Clear function definition, we need only "content" of the function
	.replace(/^function[^{]*{|}$/g, '')
	// Prepare it for injecting arguments
	.replace(/_f\s*\(\)/, '_f (...args)');

/**
 * Source code cache of the `observable` function for faster creation of different lengths variations.
 *
 * @private
 */
_observable.code = _observable[0].toString()
	// Clear function definition, we need only "content" of the function
	.replace(/^function[^{]*{|}$/g, '')
	// Prepare it for injecting arguments
	.replace(/_f\s*\(\)/, '_f (...args)');

/**
 * Creates a new variation of `nuonce` for specified length of arguments and stores it in cache.
 *
 * @private
 * @param {Array}  cache
 * @param {Number} length
 * @return {Function}
 */
function _nuoncesPrepare (cache, length) {
	var src = cache.code;
	var args = new Array(length);

	for (var i = length - 1; i > -1; i--) {
		args[i] = 'a' + i;
	}

	var argv = args.join(', ');

	/* eslint-disable no-new-func */
	cache[length] = new Function('fn', 'cb', src.replace('...args', argv));
	/* eslint-enable no-new-func */

	return cache[length];
}

/**
 * Returns a function that will call the `fn` function just once.
 * Every next time the returned function is called, it will return value from the first call.
 *
 * The returned function has a copy of all enumerable properties and keeps `length`
 * (number of declared arguments) of target function.
 *
 * @example
 * const nuonce = require('nuonce/copied');
 * let i = 0;
 * const f = () => ++i;
 * f.myProp = 'original';
 * const once = nuonce(f);
 * once() === once() || console.error('values differ');
 * f.myProp = 'changed';
 * once.myProp === 'original' || console.error('copied property differs from original');
 *
 * @function
 * @memberof module:nuonce
 * @param {Function} fn
 * @param {Function} [cb]   call back once with result, right after first call
 * @return {Function}
 */
function copied (fn, cb) {
	var l = fn.length;
	var f = cb ? (_observable[l] || _nuoncesPrepare(_observable, l))(fn, cb) : (_stripped[l] || _nuoncesPrepare(_stripped, l))(fn);

	var keys = Object.keys(fn);
	var k;
	for (var i = 0, imax = keys.length; i < imax; i++) {
		k = keys[i];
		f[k] = fn[k];
	}

	return f;
}
