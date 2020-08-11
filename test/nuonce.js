/* eslint strict: 0 */

'use strict';

const nuonces = require('../index.js');
const support = Object.assign(require('./support/vm.js'), require('./support/fn.js'));
const test = require('tape-catch');

const modes = [
	'stripped',
	'observable',
	'copied',
	'proxied'
];

const NO_ARGS = 0;
const ONE_ARG = 1;
const TWO_ARGS = 2;

const NO_PROPS = 0;
const ONE_PROP = 1;

test('nuonce', t => {
	t.ok(support.vmHasFastProperties(nuonces), 'Should export object with fast properties');
	t.end();
});

modes.map(mode => test('nuonce.' + mode, t => runTests(nuonces[mode], t)));

function runTests (nuonce, t) {
	testIfThrowsOnNonFunction(nuonce, t);
	testIfNuonceReturnsFunction(nuonce, t);
	testIfItReturnsSameValue(nuonce, t);
	testIfThisContextIsRetained(nuonce, t);
	testIfItCreatesSingleInstanceOfObject(nuonce, t);
	testIfItPassessAllArguments(nuonce, t);
	testIfOriginalFunctionIsCalledOnlyOnce(nuonce, t);

	if (nuonce !== nuonces.stripped) {		
		testIfThrowsOnNonFunctionCallback(nuonce, t);
		testIfItCallsBackAfterEveryCall(nuonce, t);
	}

	if (nuonce === nuonces.proxied) {
		testIfItCallsBackAfterEveryCallWhenProxied(nuonce, t);
	}

	if (nuonce === nuonces.stripped || nuonce === nuonces.observable) {
		testIfReturnedFunctionHasPropertiesRemoved(nuonce, t);
	}
	else {
		testIfReturnedFunctionHasSameProperties(nuonce, t);
	}

	testIfItCanBeOptimized(nuonce, t);
	testIfItCanBeOptimizedWhenTargetFnIsUnoptimizable(nuonce, t);

	t.end();
}

function testIfThrowsOnNonFunction (nuonce, t) {
	t.throws(() => nuonce({}), 'Should throw error when called for non-function');
}

function testIfThrowsOnNonFunctionCallback (nuonce, t) {
	t.throws(() => nuonce(() => 1, true), 'Should throw error when callback is not a function');
}

function testIfNuonceReturnsFunction (nuonce, t) {
	var testValue = Math.random();
	var testFunction = function testFunction (a, b, c) {
		a = b + c;
		return testValue;
	};
	testFunction.customProperty = Math.random();

	t.strictEqual(typeof nuonce(testFunction), 'function', 'Should return a function');
	t.strictEqual(nuonce(testFunction)(), testValue, 'Returned value should be callable');
}

function testIfItReturnsSameValue (nuonce, t) {
	const testFunction = nuonce(Math.random);
	t.strictEqual(testFunction(), testFunction(), 'Should return value from wrapped function');
}

function testIfThisContextIsRetained (nuonce, t) {
	const ctx = {test: 1};
	const testFunction = nuonce(function testFunction () {
		this.added = 'value';
		return this === ctx;
	});

	t.ok(testFunction.call(ctx), '`this` value should be passed to target function');
	t.strictEqual(ctx.added, 'value', 'Context object should have `added` property.');
}

function testIfItCreatesSingleInstanceOfObject (nuonce, t) {
	const TestConstructor = nuonce(function () {
		this.title = 'test';
		return this;
	});
	t.strictEqual(new TestConstructor(), new TestConstructor(), 'Should return the same instance of an object');
}

function testIfItPassessAllArguments (nuonce, t) {
	const sum = function sum (a, b, c) {
		return a + b + c;
	};
	const testFunction = nuonce(sum);

	var a = Math.random();
	var b = Math.random();
	var c = Math.random();

	t.strictEqual(testFunction(a, b, c), sum(a, b, c), 'Should pass all arguments to wrapped function');
}

function testIfOriginalFunctionIsCalledOnlyOnce (nuonce, t) {
	let wasCalled = 0;
	const testFunction = nuonce(() => {
		t.strictEqual(wasCalled, 0, 'testFunction should be called just once');
		wasCalled++;
		return wasCalled;
	});

	t.strictEqual(testFunction(), testFunction(), 'Value returned from second call should be the same');
	t.strictEqual(wasCalled, 1, 'Should call testFunction once');
}

function testIfItCallsBackAfterEveryCall (nuonce, t) {
	let wasCalled = 0;
	let i = 0;
	const testFunction = nuonce(() => ++i, status => {
		t.strictEqual(status.value, i, 'Should pass returned value to the callback function');
		wasCalled = status.calls;
		return status.value;
	});

	t.strictEqual(testFunction(), testFunction(), 'Value returned from second call should be the same');
	t.strictEqual(wasCalled, 2, 'Should call back each time target is called');

	wasCalled = 0;
	const testFunction2 = nuonce(first => ++i, status => {
		t.strictEqual(status.value, i, 'Should pass returned value to the callback function');
		wasCalled = status.calls;
		return status.value;
	});

	t.strictEqual(testFunction2('dummy1'), testFunction2('dummy2'), 'Value returned from second call should be the same');
	t.strictEqual(wasCalled, 2, 'Should call back each time target is called');
}

function testIfItCallsBackAfterEveryCallWhenProxied (nuonce, t) {
	let wasCalled = 0;
	let i = 0;
	const creator = function () { this.id = ++i; };
	const testFunction = nuonce(creator, status => {
		t.strictEqual(status.value.id, i, '`new nuonced` should pass returned value to the callback function');
		wasCalled = status.calls;
		return status.value;
	});

	t.strictEqual(new testFunction(), new testFunction(), '`new nuonced` should return the same instance of an object');
	t.strictEqual(wasCalled, 2, '`new nuonced` should call back each time target is called');
}

function testIfItCanBeOptimized (nuonce, t) {
	support.vmPrepareForOptimization(nuonce);
	nuonce(support.createFn(NO_ARGS, NO_PROPS));
	nuonce(support.createFn(TWO_ARGS, ONE_PROP));
	support.vmOptimizeOnNextCall(nuonce);
	// Single call is not enough to optimize any more (starting around v14?), so call it many many times ;P
	for (let i = 10000; i > 0; i--) nuonce(support.createFn(ONE_ARG, NO_PROPS));
	// nuonce(support.createFn(ONE_ARG, NO_PROPS));
	const status = support.vmGetOptimizationStatus(nuonce);
	const optimized = status === support.OPTIMIZATION.OK || status === support.OPTIMIZATION.TURBO;
	t.ok(optimized, 'Should be optimizable');
}

function testIfItCanBeOptimizedWhenTargetFnIsUnoptimizable (nuonce, t) {
	// This may output deoptimization info, especially if run after `testIfItCanBeOptimized`,
	// where we optimize code :/.
	support.vmDeoptimize(nuonce);
	t.strictEqual(support.vmGetOptimizationStatus(nuonce), support.OPTIMIZATION.NONE, 'Should be unoptimized at start of test');

	support.vmPrepareForOptimization(nuonce);
	nuonce(support.createFn(NO_ARGS, NO_PROPS, true));
	nuonce(support.createFn(ONE_ARG, ONE_PROP, true));

	const target = support.createFn(TWO_ARGS, NO_PROPS, true);
	t.strictEqual(support.vmGetOptimizationStatus(target), support.OPTIMIZATION.NONE, 'Target function should be unoptimizable');

	support.vmOptimizeOnNextCall(nuonce);
	// Single call is not enough to optimize any more (starting around v14?), so call it many many times ;P
	for (let i = 100000; i > 0; i--) nuonce(target);

	const status = support.vmGetOptimizationStatus(nuonce);
	const optimized = status === support.OPTIMIZATION.OK || status === support.OPTIMIZATION.TURBO;
	t.ok(optimized, 'Should be optimizable even when target function is unoptimizable');
}

function testIfReturnedFunctionHasPropertiesRemoved (nuonce, t) {
	var testValue = Math.random();
	var testFunction = function testFunction (a, b, c) {
		a = b + c;
		return testValue;
	};
	testFunction.customProperty = Math.random();

	t.strictEqual(nuonce(testFunction).length, 0, 'Returned function should `length` equal zero');
	t.strictEqual(typeof nuonce(testFunction).customProperty, 'undefined', 'Returned value should not have custom properties');
}

function testIfReturnedFunctionHasSameProperties (nuonce, t) {
	var testValue = Math.random();
	var testFunction = function testFunction (a, b, c) {
		a = b + c;
		return testValue;
	};
	testFunction.customProperty = Math.random();

	t.strictEqual(nuonce(testFunction).length, testFunction.length, 'Returned function should have the same `length` as target function');
	t.strictEqual(nuonce(testFunction).customProperty, testFunction.customProperty, 'Returned value should have the same custom properties');
}
