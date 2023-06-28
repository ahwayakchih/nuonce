/* global gc */
/* eslint strict: 0 */

'use strict';

const nuonce = require('../index.js');
const v8 = require('v8');

const modes = [
	'stripped',
	'copied'
];

if (nuonce.proxied) {
	modes.push('proxied');
}

function fakeTestOnce (once) {
	const testFunction = once(Math.random);
	const result = testFunction();
	if (result !== testFunction()) console.error(new Error('Results should be the same'));
}

function fakeTest () {
	for (let m = 0; m < modes.length; m++) {
		for (let i = 0; i < 1000000; i++) {
			fakeTestOnce(nuonce[modes[m]]);
		}
	}
}

if (typeof gc !== 'function') {
	v8.setFlagsFromString('--expose-gc');
	console.error('`gc` function is missing. Make sure to run this test with `--expose-gc` option passed to node.');
	process.exit(1);
}

v8.setFlagsFromString('--trace-gc');

gc();
v8.writeHeapSnapshot('reports/test-memory-0.heapsnapshot');

console.log('start test');
fakeTest();
console.log('end test');

gc();
v8.writeHeapSnapshot('reports/test-memory-1.heapsnapshot');
