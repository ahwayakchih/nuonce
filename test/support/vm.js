/* eslint strict: 0 */

'use strict';

/* eslint-disable no-magic-numbers */
// These bits must be in sync with bits defined in Runtime_GetOptimizationStatus
// From: https://github.com/v8/v8/blob/master/test/mjsunit/mjsunit.js
// More about native syntax: https://github.com/v8/v8/blob/master/src/runtime/runtime.h
const V8OptimizationStatus = {
	kIsFunction                     : 1 << 0,
	kNeverOptimize                  : 1 << 1,
	kAlwaysOptimize                 : 1 << 2,
	kMaybeDeopted                   : 1 << 3,
	kOptimized                      : 1 << 4,
	kTurboFanned                    : 1 << 5,
	kInterpreted                    : 1 << 6,
	kMarkedForOptimization          : 1 << 7,
	kMarkedForConcurrentOptimization: 1 << 8,
	kOptimizingConcurrently         : 1 << 9,
	kIsExecuting                    : 1 << 10,
	kTopmostFrameIsTurboFanned      : 1 << 11,
	kLiteMode                       : 1 << 12,
	kMarkedForDeoptimization        : 1 << 13
};

/* eslint-disable no-magic-numbers */
const OPTIMIZATION = {
	OK           : 1,
	NONE         : 2,
	ALWAYS       : 3,
	NEVER        : 4,
	DEOPTIMIZABLE: 6,
	TURBO        : 7,
	INTERPRETED  : 8
};
/* eslint-enable no-magic-numbers */

module.exports = {
	OPTIMIZATION,
	vmGetOptimizationStatus,
	vmDeoptimize,
	vmNeverOptimize,
	vmPrepareForOptimization,
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
function vmPrepareForOptimization (fn) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node to enable it.');
		return false;
	}

	if (Number(process.version.split('.')[0].replace('v', '')) < 12) {
		return false;
	}

	return eval('%PrepareFunctionForOptimization(fn)');
}

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
	// console.log(result.toString('2'));

	if (Number(process.version.split('.')[0].replace('v', '')) < 8) {
		return result;
	}

	// if ((result & V8OptimizationStatus.kNeverOptimize) === 0) {
	// 	return OPTIMIZATION.NEVER;
	// }

	if (result & V8OptimizationStatus.kLiteMode || result & V8OptimizationStatus.kNeverOptimize) {
		// Optimizations are disabled in Lite mode or when optimizations are disabled
		return OPTIMIZATION.NONE;
	}

	if ((result & V8OptimizationStatus.kIsFunction) === 0) {
		// Not a function
		return OPTIMIZATION.NONE;
	}

	if (result & (V8OptimizationStatus.kMaybeDeopted || V8OptimizationStatus.kMarkedForDeoptimization)) {
		return OPTIMIZATION.DEOPTIMIZABLE;
	}

	// if ((result & V8OptimizationStatus.kOptimized) === 0 && (result & V8OptimizationStatus.kInterpreted)) {
	// 	return OPTIMIZATION.INTERPRETED;
	// }

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
