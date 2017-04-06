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
	 * Returns callable function that will call `fn` function only once.
	 * Every next time returned object is called, it will return value from the first call.
	 *
	 * Returned function does not keep properties or `length` of target function, so if
	 * callers depend on its decorations and/or specific `length`, use `{@link module:nuonce.copied}` instead.
	 *
	 * @function
	 * @param {Function} fn
	 * @return {Function}
	 */
	stripped: _nuonce,

	/**
	 * Returns callable function that will call `fn` function only once.
	 * Every next time returned object is called, it will return value from the first call.
	 *
	 * Returned function has enumerable properties and `length` (number of declared arguments) copied from target function.
	 *
	 * @function
	 * @param {Function} fn
	 * @return {Function}
	 */
	copied: _nuonceWithCopiedProperties,

	/**
	 * Returns callable function that will call `fn` function only once.
	 * Every next time returned object is called, it will return value from the first call.
	 *
	 * Returned function has `length` (number of declared arguments) copied from target function.
	 * Enumerable properties of target function are semi-proxied through returned function by
	 * setting up setters and getters for each of them.
	 * That allows callers to get values changed on target function even after it was nuonced,
	 * but still does not allow to get properties that are added later, like with full Proxy object.
	 *
	 * This method is marked as private, because it's pretty useless:
	 * - it has good performance only when there are no properties to "mirror"
	 * - it is A LOT slower than full Proxy object when there are properties to "mirror"
	 *
	 * @private
	 * @function
	 * @param {Function} fn
	 * @return {Function}
	 */
	mirrored: _nuonceWithMirroredProperties,

	/**
	 * Returns callable proxy object that will call `fn` function only once.
	 * Every next time returned object is called, it will return value from first the call.
	 *
	 * Depends on existance of Proxy, so it exists only when proxies are available.
	 * Returned Proxy object points to wrapped target function.
	 *
	 * **WARNING:** Proxy does not pass current context to target function, so `this` will be undefined there.
	 * If you need specific `this`, bind target function before passing it to nuonce.
	 *
	 * @function
	 * @param {Function} fn
	 * @return {external:Proxy}
	 */
	proxied: _nuonceWithProxyES6,

	/**
	 * Currently it simply points to `{@link module:nuonce.proxied}`.
	 *
	 * @function
	 * @param {Function} fn
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
 * Source code cache of `_nuonce` function for faster creation of different lengths variations.
 *
 * @private
 */
var _nuonceSource = _nuonce.toString().replace(/^function[^{]*{|}$/g, '');

// Strip coverage stuff, to prevent test failures
_nuonceSource = _nuonceSource.replace(/__cov_[^+]+\+\+;/g, '');
// Prepare it for injecting arguments
_nuonceSource = _nuonceSource.replace(/fn\.apply\(this,\s*args\)/, 'fn.call(this, ...args)');

/**
 * Creates new variation of _nuonce for specified length of arguments and stores it in `_nuonces`.
 *
 * @private
 * @return {Function}
 */
function _nuoncesPrepare (length) {
	var src = _nuonceSource;
	var args = new Array(length + 1);

	for (var i = length - 1; i >= 0; i--) {
		args[i] = 'a' + i;
	}

	args[length] = '...args';
	var argv = args.join(', ');

	/* eslint-disable no-new-func */
	_nuonces[length] = new Function('fn', src.replace('...args', argv).replace('this, ...args', 'this, ' + argv));
	/* eslint-enable no-new-func */

	return _nuonces[length];
}

/**
 * Creates Function wrapper that stores first result of target function when it is called for the first time.
 * Every next time it is called, it will simply return first result, without calling target function ever again.
 *
 * @private
 * @return {Function}
 */
function _nuonce (fn) {
	if (typeof fn !== 'function') {
		throw new Error('argument must be a function');
	}

	var r;

	function _f (...args) {
		if (fn) {
			r = fn.apply(this, args);

			// Free any references to target function
			fn = null;
		}

		return r;
	}

	return _f;
}

/**
 * Creates `_nuonce` and copies enumerable properties from target function to it.
 *
 * @private
 * @return {Function}
 */
function _nuonceWithCopiedProperties (fn) {
	var l = fn.length;
	var f = (_nuonces[l] || _nuoncesPrepare(l))(fn);

	var keys = Object.keys(fn);
	var k;
	for (var i = 0, imax = keys.length; i < imax; i++) {
		k = keys[i];
		f[k] = fn[k];
	}

	return f;
}

/**
 * Creates `_nuonce` and sets up setters and getters on it, for each of target function's enumerable properties.
 *
 * @private
 * @return {Function}
 */
/* istanbul ignore next */
function _nuonceWithMirroredProperties (fn) {
	var l = fn.length;
	var f = (_nuonces[l] || _nuoncesPrepare(l))(fn);

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
 * Creates Proxy (ES6) function pointing to target function.
 *
 * @private
 * @return {external:Proxy}
 */
/* istanbul ignore next */
function _nuonceWithProxyES6 (fn) {
	var r;

	return new Proxy(fn, {
		apply: function (_, ctx, args) {
			if (fn) {
				r = fn.apply(ctx, args);
				fn = null;
			}

			return r;
		},
		construct: function (ctx, args/* , target*/) {
			if (fn) {
				r = fn.apply(ctx, args);
				fn = null;
			}

			return r;
		}
	});
}
