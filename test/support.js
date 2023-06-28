/* eslint strict: 0 */

'use strict';

const support = require('./support/fn.js');
const natives = require('./support/vm.js');
const test = require('tape-catch');

const maxNumOfArgsAndProps = 9;

test('support.createFn', t => {
	t.ok(typeof support.createFn === 'function', 'Should be a function');

	var fn = support.createFn();
	t.ok(typeof fn === 'function', 'Should return a function');

	testCreateFnArgc(t, maxNumOfArgsAndProps);
	testCreateFnPropc(t, maxNumOfArgsAndProps);
	testCreateFnOptimizable(t);
	testCreateFnUnoptimizable(t);

	t.end();
});

test('support.repeatFn', t => {
	t.ok(typeof support.repeatFn === 'function', 'Should be a function');

	testRepeatFn(t, maxNumOfArgsAndProps);
	testRepeatFn(t, maxNumOfArgsAndProps, 'foo');

	t.end();
});

function testCreateFnArgc (t, argcMax) {
	var fn;
	for (let i = 1; i <= argcMax; i++) {
		fn = support.createFn(i);
		t.strictEqual(fn.length, i, 'Should return a function with ' + i + ' number of arguments');
	}
}

function testCreateFnPropc (t, propcMax) {
	var fn;
	for (let i = 1; i <= propcMax; i++) {
		fn = support.createFn(0, i);
		t.strictEqual(Object.keys(fn).length, i, 'Should return a function with ' + i + ' number of properties');
	}
}

function testCreateFnOptimizable (t) {
	var fn = support.createFn(1, 0, false);
	t.strictEqual(natives.vmIsFunctionOptimized(fn), false, 'Should return unoptimized function');

	natives.vmPrepareForOptimization(fn);
	fn(1);
	fn(maxNumOfArgsAndProps);
	natives.vmOptimizeOnNextCall(fn);
	fn(maxNumOfArgsAndProps - 1);
	for (let i = 100000; i > 0; i--) fn(i);

	// console.log(natives.vmGetOptimizationStatusObject(fn));
	t.strictEqual(natives.vmIsFunctionOptimized(fn), true, 'Returned function should become optimized');
}

function testCreateFnUnoptimizable (t) {
	var fn = support.createFn(1, 0, true);
	t.strictEqual(natives.vmIsFunctionOptimized(fn), false, 'Should return unoptimized function');

	natives.vmPrepareForOptimization(fn);
	fn(1);
	fn(maxNumOfArgsAndProps);
	natives.vmOptimizeOnNextCall(fn);
	fn(maxNumOfArgsAndProps - 1);
	for (let i = 100000; i > 0; i--) fn(i);

	t.strictEqual(natives.vmIsFunctionOptimized(fn), false, 'Returned function should stay unoptimized');
}

function testRepeatFn (t, max, prop) {
	var called = 0;
	var calledProp = 0;
	var args = true;

	var argc = 2;
	var calls = 3;

	function test (a, b) {
		called++;
		if (arguments.length !== argc) {
			args = false;
		}
		return a + b;
	}

	if (prop) {
		test[prop] = function () {
			calledProp++;
			return 1;
		};
	}

	support.repeatFn(test, argc, calls, prop);
	t.strictEqual(called, calls, 'Should call target function specified number of times');
	if (prop) {
		t.strictEqual(calledProp, 1, 'Should call property once');
	}
	t.ok(args, 'Should call target function with specified number of arguments');
}
