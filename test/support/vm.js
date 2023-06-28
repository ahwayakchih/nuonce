/* eslint strict: 0 */

'use strict';

/* eslint-disable no-magic-numbers */
// These bits must be in sync with bits defined in Runtime_GetOptimizationStatus
// From: https://github.com/v8/v8/blob/master/test/mjsunit/mjsunit.js
// More about native syntax: https://github.com/v8/v8/blob/master/src/runtime/runtime.h
const V8OptimizationStatus = {
	kIsFunction                         : 1 << 0,
	kNeverOptimize                      : 1 << 1,
	kAlwaysOptimize                     : 1 << 2,
	kMaybeDeopted                       : 1 << 3,
	kOptimized                          : 1 << 4,
	kMaglevved                          : 1 << 5,
	kTurboFanned                        : 1 << 6,
	kInterpreted                        : 1 << 7,
	kMarkedForOptimization              : 1 << 8,
	kMarkedForConcurrentOptimization    : 1 << 9,
	kOptimizingConcurrently             : 1 << 10,
	kIsExecuting                        : 1 << 11,
	kTopmostFrameIsTurboFanned          : 1 << 12,
	kLiteMode                           : 1 << 13,
	kMarkedForDeoptimization            : 1 << 14,
	kBaseline                           : 1 << 15,
	kTopmostFrameIsInterpreted          : 1 << 16,
	kTopmostFrameIsBaseline             : 1 << 17,
	kIsLazy                             : 1 << 18,
	kTopmostFrameIsMaglev               : 1 << 19,
	kOptimizeOnNextCallOptimizesToMaglev: 1 << 20
};

module.exports = {
	V8OptimizationStatus,
	vmGetOptimizationStatus,
	vmGetOptimizationStatusObject,
	vmDeoptimize,
	vmNeverOptimize,
	vmPrepareForOptimization,
	vmOptimizeOnNextCall,
	vmIsFunctionOptimized,
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

	// Sometime around Node v14 calling `OptimizeFunctionOnNextCall` on function that was marked with
	// `NeverOptimizeFunction` started crashing. So try to prevent that.
	const status = eval('%GetOptimizationStatus(fn)');
	if (status & V8OptimizationStatus.kNeverOptimize == V8OptimizationStatus.kNeverOptimize) {
		// console.warn('Function marked to never be optimized will not be optimized');
		return false;
	}

	return eval('%PrepareFunctionForOptimization(fn)');
}

function vmOptimizeOnNextCall (fn) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node to enable it.');
		return false;
	}

	// Sometime around Node v14 calling `OptimizeFunctionOnNextCall` on function that was marked with
	// `NeverOptimizeFunction` started crashing. So try to prevent that.
	const status = eval('%GetOptimizationStatus(fn)');
	if (status & V8OptimizationStatus.kNeverOptimize == V8OptimizationStatus.kNeverOptimize) {
		// console.warn('Function marked to never be optimized will not be optimized');
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

	return eval('%GetOptimizationStatus(fn)');
}

function vmGetOptimizationStatusObject (fn) {
	const status = vmGetOptimizationStatus(fn) || 0;

	var result = Object.assign({}, V8OptimizationStatus);
	for (let k in V8OptimizationStatus) {
		result[k] = (status & V8OptimizationStatus[k]) > 0;
	}

	return result;
}

function vmIsFunctionOptimized (fn) {
	const result = vmGetOptimizationStatus(fn);

	if (!result) {
		return false;
	}

	return (result & V8OptimizationStatus.kOptimized) > 0;
}

function vmHasFastProperties (obj) {
	if (!hasNativeSyntax) {
		console.warn('Native syntax is not enabled. Use `--allow-natives-syntax` flag when running node to enable it.');
		return false;
	}

	return eval('%HasFastProperties(obj)');
}
/* eslint-enable no-eval, no-unused-vars */
