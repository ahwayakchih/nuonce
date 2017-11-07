/* eslint strict: 0 */

'use strict';

/* eslint-disable no-magic-numbers */
// These bits must be in sync with bits defined in Runtime_GetOptimizationStatus
// From: https://github.com/v8/v8/blob/master/test/mjsunit/mjsunit.js
const V8OptimizationStatus = {
	kIsFunction    : 1 << 0,
	kNeverOptimize : 1 << 1,
	kAlwaysOptimize: 1 << 2,
	kMaybeDeopted  : 1 << 3,
	kOptimized     : 1 << 4,
	kTurboFanned   : 1 << 5,
	kInterpreted   : 1 << 6
};

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
	vmDeoptimize,
	vmNeverOptimize,
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
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node to enable it.');
		return false;
	}

	return eval('%OptimizeFunctionOnNextCall(fn)');
}

function vmNeverOptimize (fn) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node to enable it.');
		return false;
	}

	return eval('%NeverOptimizeFunction(fn)');
}

function vmDeoptimize (fn) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node to enable it.');
		return false;
	}

	process.stdout.write('[deoptimizing on purpose]\n');
	return eval('%DeoptimizeFunction(fn)');
}

function vmGetOptimizationStatus (fn) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node to enable it.');
		return false;
	}

	const result = eval('%GetOptimizationStatus(fn)');
	if (Number(process.version.split('.')[0].replace('v', '')) < 8) {
		return result;
	}

	// if ((result & V8OptimizationStatus.kNeverOptimize) === 0) {
	// 	return OPTIMIZATION.NEVER;
	// }

	if ((result & V8OptimizationStatus.kIsFunction) === 0) {
		// Not a function
		return OPTIMIZATION.NONE;
	}

	if (result & V8OptimizationStatus.kMaybeDeopted) {
		return OPTIMIZATION.DEOPTIMIZABLE;
	}

	if ((result & V8OptimizationStatus.kOptimized) && (result & V8OptimizationStatus.kTurboFanned)) {
		return OPTIMIZATION.TURBO;
	}

	if (result & V8OptimizationStatus.kOptimized) {
		return OPTIMIZATION.OK;
	}

	return OPTIMIZATION.NONE;
}

function vmHasFastProperties (obj) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node to enable it.');
		return false;
	}

	return eval('%HasFastProperties(obj)');
}
/* eslint-enable no-eval, no-unused-vars */
