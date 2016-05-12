/* global gc */
/* eslint strict: 0 */
'use strict';

const nuonce = require('../index.js');
const heapdump = require('heapdump');
// const profiler = require('v8-profiler');

const modes = [
	'stripped',
	'copied'
];

if (nuonce.proxied) {
	modes.push('proxied');
}

// const leak = [];
function fakeTestOnce (once) {
	const testFunction = once(Math.random);
	testFunction();
	testFunction();
	testFunction();
}

function fakeTest () {
	for (let m = 0; m < modes.length; m++) {
		for (let i = 0; i < 10000; i++) {
			fakeTestOnce(nuonce[modes[m]]);
		}
	}
}

if (typeof gc !== 'function') {
	console.error('`gc` function is missing. Make sure to run this test with `--expose-gc` option passed to node.');
	process.exit(1);
}

gc();
heapdump.writeSnapshot('reports/test-memory-0.heapsnapshot');

fakeTest();

gc();
heapdump.writeSnapshot('reports/test-memory-1.heapsnapshot');
