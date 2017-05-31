/* eslint strict: 0 */

'use strict';

module.exports = {
	createFn,
	repeatFn
};

/**
 * Create function to be passed to tested once/nuonce.
 * Create `propc` number of properties on it. Each one will be just a arrow function
 * that returns result of `Math.random()` function.
 *
 * @param {number} argc                   Number of arguments that returned function should declare
 * @param {number} propc                  Number of properties that returned function has
 * @param {boolean} makeItUnoptimizable   True to make the returned function unoptimizable
 * @return {Function}
 */
function createFn (argc, propc, makeItUnoptimizable) {
	const opts = new Array(argc || 0);
	for (let x = argc - 1; x > -1; x--) {
		opts[x] = 'a' + x;
	}

	let code = 'return ' + (opts.join(' + ') || '0') + ' + ' + Math.random() + ';';

	if (makeItUnoptimizable) {
		// According to https://github.com/petkaantonov/bluebird/wiki/Optimization-killers#2-unsupported-syntax
		// using `debugger` in code, even if that code will never be executed, makes the function unoptimizable.
		// But that stopped to be true with Node 8, so we go back to using non-existing `argments`.
		code = 'arguments[arguments.length + 1];\n';
	}

	opts.push(code);

	/* eslint-disable no-new-func */
	var fn = new Function(...opts);
	/* eslint-enable no-new-func */

	if (propc) {
		return _addPropsToFn(fn, propc);
	}

	return fn;
}

/**
 * Add specified number of properties to function.
 * Each of those properties will be just an arrow function
 * that returns result of `Math.random()` function.
 *
 * @private
 * @param {function} fn    Target function
 * @param {number} propc   Number of properties to add
 * @return {Function}
 */
function _addPropsToFn (fn, propc) {
	var key = 'foo';
	fn[key] = () => Math.random();

	for (var i = 1; i < propc; i++) {
		key = 'foo' + String(Math.random()).substr(2); // eslint-disable-line no-magic-numbers
		fn[key] = () => Math.random();
	}

	return fn;
}

/**
 * Call given function multiple times and call its `foo` method once too (if available).
 * Returns sum of results from target function and its `foo` method.
 *
 * @param {Function} fn         Target function
 * @param {number}   argc       Number of arguments to call target function with
 * @param {number}   calls      Number of times target function should be called
 * @param {string}   callProp   Name of the method of target function to call (if available), e.g., `foo` to call `fn.foo()`
 * @return {number|NaN}
 */
function repeatFn (fn, argc, calls, callProp) {
	var result;

	var i;
	const argv = new Array(argc);
	for (i = argc - 1; i > -1; i--) {
		argv[i] = Math.random();
	}

	for (i = calls - 1; i > -1; i--) {
		result += fn.apply(this, argv);
	}

	if (callProp) {
		result += fn[callProp] && fn[callProp]();
	}

	return result;
}
