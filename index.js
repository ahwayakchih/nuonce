/* eslint strict: 0 */

'use strict';

/**
 * Proxy
 *
 * @external Proxy
 * @see {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy}
 */

/**
 * Nuonce exports four functions: `default`, `stripped`, `copied` and `proxied`.
 *
 * @exports nuonce
 * @see {@link module:nuonce.default}, {@link module:nuonce.stripped}, {@link module:nuonce.copied}, {@link module:nuonce.proxied}
 */
module.exports = {
	/**
	 * Returns a function that will call the `fn` function just once.
	 * Every next time the returned function is called, it will return value from the first call.
	 *
	 * The returned function does not keep properties or `length` of target function, so if
	 * callers depend on its decorations and/or specific `length`, use the `{@link module:nuonce.copied}` method instead.
	 *
	 * @function
	 * @param {Function} fn
	 * @param {Function} [cb]   call back once with result, right after first call
	 * @return {Function}
	 */
	stripped: _nuonce,

	/**
	 * Returns a function that will call the `fn` function just once.
	 * Every next time the returned function is called, it will return value from the first call.
	 *
	 * The returned function has enumerable properties and `length` (number of declared arguments)
	 * copied from the target function.
	 *
	 * @function
	 * @param {Function} fn
	 * @param {Function} [cb]   call back once with result, right after first call
	 * @return {Function}
	 */
	copied: _nuonceWithCopiedProperties,

	/**
	 * Returns a function that will call the `fn` function just once.
	 * Every next time the returned function is called, it will return value from the first call.
	 *
	 * The returned function has `length` (number of declared arguments) copied from the target function.
	 * Enumerable properties of the target function are semi-proxied through the returned function by
	 * setting up setters and getters for each of them.
	 * That allows callers to get updated property values of the target function even after it was "nuonced",
	 * but still does not allow to get new properties added at a later time, unlike with a full Proxy object.
	 *
	 * This method is marked as private, because it's pretty useless:
	 * - it has performs "ok" only when there are no properties to "mirror"
	 * - it is A LOT slower than full Proxy object when there are properties to "mirror"
	 *
	 * @private
	 * @function
	 * @param {Function} fn
	 * @param {Function} [cb]   call back once with result, right after first call
	 * @return {Function}
	 */
	mirrored: _nuonceWithMirroredProperties,

	/**
	 * Returns a callable Proxy object that will call the `fn` function just once.
	 * Every next time the returned object is called, it will return value from the first call.
	 *
	 * The returned Proxy object points to the target function.
	 *
	 * @function
	 * @param {Function} fn
	 * @param {Function} [cb]   call back once with result, right after first call
	 * @return {external:Proxy}
	 */
	proxied: _nuonceWithProxyES6,

	/**
	 * Currently it simply points to the `{@link module:nuonce.proxied}` for greatest compatibility.
	 *
	 * @function
	 * @param {Function} fn
	 * @param {Function} [cb]   call back once with result, right after first call
	 * @return {external:Proxy|Function}
	 */
	default: _nuonceWithProxyES6
};

/**
 * List of `_nuonce` versions for different lengths of arguments.
 *
 * @private
 * @type {Function[]}
 */
var _nuonces = [
	_nuonce
];

/**
 * Source code cache of the `_nuonce` function for faster creation of different lengths variations.
 *
 * @private
 */
var _nuonceSource = _nuonce.toString().replace(/^function[^{]*{|}$/g, '');

// Strip coverage stuff, to prevent test failures
_nuonceSource = _nuonceSource.replace(/__cov_[^+]+\+\+;/g, '');
// Prepare it for injecting arguments
_nuonceSource = _nuonceSource.replace(/_f\s*\(\)/, '_f (...args)');

/**
 * Creates a new variation of `_nuonce` for specified length of arguments and stores it in `_nuonces` cache.
 *
 * @private
 * @param {Number} length
 * @return {Function}
 */
function _nuoncesPrepare (length) {
	var src = _nuonceSource;
	var args = new Array(length);

	for (var i = length - 1; i > -1; i--) {
		args[i] = 'a' + i;
	}

	var argv = args.join(', ');

	/* eslint-disable no-new-func */
	_nuonces[length] = new Function('fn', 'cb', src.replace('...args', argv));
	/* eslint-enable no-new-func */

	return _nuonces[length];
}

/**
 * Creates a Function wrapper that stores result of a target function after it is called for the first time.
 * Every next time it is called, it will simply return the first result, without calling the target function ever again.
 *
 * @private
 * @param {Function} fn
 * @param {Function} [cb]   call back once with result, right after first call
 * @return {Function}
 */
function _nuonce (fn, cb) {
	if (typeof fn !== 'function') {
		throw new Error('argument must be a function');
	}

	if (cb && typeof cb !== 'function') {
		throw new Error('callback must be a function');
	}

	var r;

	/**
	 * @private
	 * @return {any} whatever was returned by cb
	 */
	function _f () {
		if (fn) {
			// Use `...args` in future, when it's not so much slower than `arguments`.
			r = fn.apply(this, arguments);

			// Free any references to the target function
			fn = null;

			if (cb) {
				cb(r);
				cb = null;
			}
		}

		return r;
	}

	return _f;
}

/**
 * Creates a `_nuonce` and adds copies of enumerable properties from the target function.
 *
 * @private
 * @param {Function} fn
 * @param {Function} [cb]   call back once with result, right after first call
 * @return {Function}
 */
function _nuonceWithCopiedProperties (fn, cb) {
	var l = fn.length;
	var f = (_nuonces[l] || _nuoncesPrepare(l))(fn, cb);

	var keys = Object.keys(fn);
	var k;
	for (var i = 0, imax = keys.length; i < imax; i++) {
		k = keys[i];
		f[k] = fn[k];
	}

	return f;
}

/* istanbul ignore next */
/**
 * Creates a `_nuonce` and sets up setters and getters on it, one for each of the target function's enumerable properties.
 *
 * @private
 * @param {Function} fn
 * @param {Function} [cb]   call back once with result, right after first call
 * @return {Function}
 */
function _nuonceWithMirroredProperties (fn, cb) {
	var l = fn.length;
	var f = (_nuonces[l] || _nuoncesPrepare(l))(fn, cb);

	var getter = function (name) {
		return this[name];
	};
	var setter = function (name, value) {
		this[name] = value;
	};

	var keys = Object.keys(fn);
	var k;
	var o;
	for (var i = 0, imax = keys.length; i < imax; i++) {
		k = keys[i];

		// Following makes f into semi-proxy, but also makes this whole thing A LOT slower, even slower than full Proxy
		o = (Object.getPropertyDescriptor || Object.getOwnPropertyDescriptor)(fn, k);
		Object.defineProperty(f, k, {
			enumerable  : o.enumerable,
			configurable: o.configurable,
			get         : getter.bind(fn, k),
			set         : setter.bind(fn, k)
		});
	}

	return f;
}

/**
 * Creates a Proxy (ES6) function pointing to a target function.
 *
 * @private
 * @param {Function} fn
 * @param {Function} [cb]   call back once with result, right after first call
 * @return {external:Proxy}
 */
function _nuonceWithProxyES6 (fn, cb) {
	var r;

	if (cb && typeof cb !== 'function') {
		throw new Error('callback must be a function');
	}

	return new Proxy(fn, {
		apply: function (_, ctx, args) {
			if (fn) {
				r = _.apply(ctx, args);
				fn = null;
				if (cb) {
					cb(r);
					cb = null;
				}
			}

			return r;
		},
		construct: function (_, args, ctx) {
			if (fn) {
				r = _.apply(ctx, args);
				fn = null;
				if (cb) {
					cb(r);
					cb = null;
				}
			}

			return r;
		}
	});
}
