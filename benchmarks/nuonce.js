/* eslint strict: 0 */
'use strict';

var SECOND_MICRO = 1000000;
var MILISECOND_ACCURACY = 3;
var TIMEOUT_SECONDS = 15;

var once = require(process.env.MOD || '..');

var using;
if (process.env.MOD) {
	using = process.env.MOD;
}
else if (process.env.NUONCE) {
	using = 'nuonce.' + process.env.NUONCE;
	once = once[process.env.NUONCE];
}
else {
	using = 'nuonce.default';
	once = once.default;
}

var props = parseInt(process.env.PROPS || '0', 10);
var calls = parseInt(process.env.CALLS || '1', 10);
var multiple = parseInt(process.env.MULTI || '1', 10);

// Test simple creation and a single call
runner(props, calls, multiple || 1, TIMEOUT_SECONDS);

function prepareTestTarget (props) {
	var result = function (a) {
		// Return something stupid that cannot be simply optimized to a static value
		return (Math.random() * a) + calls;
	};

	if (!props) {
		return result;
	}

	for (var i = 0; i < props; i++) {
		result['foo' + i] = Math.random;
	}

	return result;
}

function runner (props, calls, multiple, timeout) {
	var start = process.hrtime();
	var end;

	var n = calls;
	while (n--) {
		test(props, multiple || 1);

		end = process.hrtime(start);
		if (end[0] > timeout) {
			break;
		}
	}

	if (n > 0) {
		console.log('  timed out after ' + timeout + ' seconds using ' + using);
	}
	else {
		console.log('  ' + end[0] + 's ' + (end[1] / SECOND_MICRO).toFixed(MILISECOND_ACCURACY) + 'ms using ' + using);
	}
}

function test (props, multiple) {
	var f = once(prepareTestTarget(props));

	var result;
	for (var i = 0; i < multiple; i++) {
		result = result && f(i) && (f.foo0 ? f.foo0() : true);
	}

	return result;
}
