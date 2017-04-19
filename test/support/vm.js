/* eslint strict: 0 */

'use strict';

/* eslint-disable no-magic-numbers */
const OPTIMIZATION = {
	OK           : 1,
	NONE         : 2,
	ALWAYS       : 3,
	NEVER        : 4,
	DEOPTIMIZABLE: 6,
	TURBO        : 7
};
/* eslint-enable no-magic-numbers */

module.exports = {
	OPTIMIZATION,
	vmGetOptimizationStatus,
	vmOptimizeOnNextCall,
	vmHasFastProperties
};

const hasNativeSyntax = process.execArgv.reduce((result, value) => {
	if (value === '--allow-natives-syntax') {
		return true;
	}

	return result;
}, false);

/* eslint-disable no-eval, no-unused-vars */
function vmOptimizeOnNextCall (fn) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node tu enable it.');
		return false;
	}

	return eval('%OptimizeFunctionOnNextCall(fn)');
}

function vmGetOptimizationStatus (fn) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node tu enable it.');
		return false;
	}

	return eval('%GetOptimizationStatus(fn)');
}

function vmHasFastProperties (obj) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node tu enable it.');
		return false;
	}

	return eval('%HasFastProperties(obj)');
}
/* eslint-enable no-eval, no-unused-vars */
