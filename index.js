/* eslint strict: 0 */
'use strict';

const hasProxies  = typeof Proxy !== 'undefined';
const hasProxyNew = typeof Proxy === 'function';
const hasProxyOld = hasProxies && typeof Proxy.createFunction === 'function';

/**
 * Proxy
 *
 * @external Proxy
 * @see {@link https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy}
 * @see {@link https://developer.mozilla.org/en-US/docs/Archive/Web/Old_Proxy_API}
 */

/**
 * Nuonce exports at least three functions: `default`, `stripped` and `copied`.
 * When {@link external:Proxy} API is available, there will also be `proxied` exported.
 *
 * @exports nuonce
 * @see {@link module:nuonce.default}, {@link module:nuonce.stripped}, {@link module:nuonce.copied}, {@link module:nuonce.proxied}
 */
var nuonce = module.exports;

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
nuonce.stripped = _nuonce;

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
nuonce.copied = _nuonceWithCopiedProperties;

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
nuonce.mirrored = _nuonceWithMirroredProperties;

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
nuonce.proxied = null;

/* istanbul ignore next */
if (hasProxyOld) {
	nuonce.proxied = _nuonceWithProxyOld;
}

/* istanbul ignore next */
if (hasProxyNew) {
	nuonce.proxied = _nuonceWithProxyNew;
}

/**
 * Points to `{@link module:nuonce.proxied}` or `{@link module:nuonce.copied}`, depending on availability of Proxy API.
 *
 * @function
 * @param {Function} fn
 * @return {external:Proxy|Function}
 */
nuonce.default = nuonce.proxied || nuonce.copied;

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

/**
 * Creates new variation of _nuonce for specified length of arguments and stores it in `_nuonces`.
 *
 * @private
 * @return {Function}
 */
function _nuoncesPrepare (length) {
	var src = _nuonceSource;
	var args = [];

	for (var i = 0; i < length; i++) {
		args.push('a' + i);
	}

	args.push('...args');

	/* eslint-disable no-new-func */
	// Here we replace with a bit ugly regex, we could use nicer and cleaner comment with some custom token instead,
	// but when coverage is run, comments seem to be dropped before we can use them.
	_nuonces[length] = new Function('fn', src.replace(/function\s+_f\s*\([^)]*\)/, 'function _f (' + args.join(', ') + ')').replace('fn.apply(this, args)', 'fn.call(this, ' + args.join(', ') + ')'));
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
 * Creates Proxy (using old, deprecated API) function pointing to `_nuonce` of target function with properties proxied
 * directly to target function.
 *
 * @private
 * @return {external:Proxy}
 */
/* istanbul ignore next */
function _nuonceWithProxyOld (fn) {
	var f = _nuonce(fn);

	return Proxy.createFunction({
		getOwnPropertyDescriptor: name => Object.getOwnPropertyDescriptor(fn, name),
		getPropertyDescriptor   : name => (Object.getPropertyDescriptor || Object.getOwnPropertyDescriptor)(fn, name),
		getOwnPropertyNames     : () => Object.getOwnPropertyNames(fn),
		getPropertyNames        : () => Object.getPropertyNames(fn),
		defineProperty          : (name, desc) => Object.defineProperty(fn, name, desc),
		delete                  : name => delete fn[name],
		fix                     : () => undefined
	}, f, f);
}

/**
 * Creates Proxy (ES6) function pointing to target function.
 *
 * @private
 * @return {external:Proxy}
 */
/* istanbul ignore next */
function _nuonceWithProxyNew (fn) {
	var r;

	return new Proxy(fn, {
		apply: function (_, ctx, args) {
			if (fn) {
				r = fn.apply(ctx, args);
				fn = null;
			}

			return r;
		},
		construct: function (ctx, args, target) {
			if (fn) {
				r = fn.apply(target, args);
				fn = true;
			}

			return r;
		}
	});
}
