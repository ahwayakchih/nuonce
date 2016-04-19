/* eslint strict: 0 */
'use strict';

const nuonces = require('../index.js');
const test = require('tape-catch');

const modes = [
	'stripped',
	'copied'
];

if (nuonces.proxied) {
	modes.push('proxied');
}

for (var i = 0; i < modes.length; i++) {
	test('nuonce.' + modes[i] + ' with Proxy API ' + (nuonces.proxied ? '' : 'un') + 'available', runTests.bind(null, nuonces[modes[i]]));
}

function runTests (nuonce, t) {
	testIfThrowsOnNonFunction(nuonce, t);
	testIfNuonceReturnsFunction(nuonce, t);
	testIfItReturnsSameValue(nuonce, t);
	testIfOriginalFunctionIsCalledOnlyOnce(nuonce, t);

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

function testIfOriginalFunctionIsCalledOnlyOnce (nuonce, t) {
	let wasCalled = false;
	const testFunction = nuonce(() => {
		t.strictEqual(wasCalled, false, 'testFunction should be called just once');
		wasCalled = true;
		return Math.random();
	});

	let testValue = testFunction();

	t.strictEqual(testFunction(), testValue, 'Value returned from second call should be the same');
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
