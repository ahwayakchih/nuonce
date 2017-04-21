/* eslint strict: 0 */

'use strict';

const nuonces = require('../index.js');
const support = Object.assign(require('./support/vm.js'), require('./support/fn.js'));
const test = require('tape-catch');

const modes = [
	'stripped',
	'copied',
	'proxied'
];

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
	testIfItCanBeOptimized(nuonce, t);

	if (nuonce === nuonces.stripped) {
		testIfReturnedFunctionHasPropertiesRemoved(nuonce, t);
	}
	else {
		testIfReturnedFunctionHasSameProperties(nuonce, t);
	}

	t.end();
}

function testIfThrowsOnNonFunction (nuonce, t) {
	t.throws(nuonce, 'Should throw error when called for non-function');
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
	t.strictEqual(new TestConstructor(), new TestConstructor(), 'Should return the same instance of object');
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
	let wasCalled = false;
	const testFunction = nuonce(() => {
		t.strictEqual(wasCalled, false, 'testFunction should be called just once');
		wasCalled = true;
		return Math.random();
	});

	t.strictEqual(testFunction(), testFunction(), 'Value returned from second call should be the same');
}

function testIfItCanBeOptimized (nuonce, t) {
	nuonce(support.createFn(0));
	nuonce(support.createFn(1));
	support.vmOptimizeOnNextCall(nuonce);
	nuonce(support.createFn());

	t.strictEqual(support.vmGetOptimizationStatus(nuonce), support.OPTIMIZATION.OK, 'Should be optimizable');
}

function testIfReturnedFunctionHasPropertiesRemoved (nuonce, t) {
	var testValue = Math.random();
	var testFunction = function testFunction (a, b, c) {
		a = b + c;
		return testValue;
	};
	testFunction.customProperty = Math.random();

	t.strictEqual(nuonce(testFunction, true).length, 0, 'Returned function should `length` equal zero');
	t.strictEqual(typeof nuonce(testFunction).customProperty, 'undefined', 'Returned value should not have custom properties');
}

function testIfReturnedFunctionHasSameProperties (nuonce, t) {
	var testValue = Math.random();
	var testFunction = function testFunction (a, b, c) {
		a = b + c;
		return testValue;
	};
	testFunction.customProperty = Math.random();

	t.strictEqual(nuonce(testFunction, true).length, testFunction.length, 'Returned function should have the same `length` as target function');
	t.strictEqual(nuonce(testFunction).customProperty, testFunction.customProperty, 'Returned value should have the same custom properties');
}
