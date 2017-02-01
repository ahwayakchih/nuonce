// Run through node with following flags: --trace-deopt --trace-opt --allow-natives-syntax
var nuonce = require('../index.js');

function printStatus(fn) {
	var status = %GetOptimizationStatus(fn);
	switch(status) {
		case 1: console.log('Function ' + fn.name + ' is optimized'); break;
		case 2: console.log('Function ' + fn.name + ' is not optimized'); break;
		case 3: console.log('Function ' + fn.name + ' is always optimized'); break;
		case 4: console.log('Function ' + fn.name + ' is never optimized'); break;
		case 6: console.log('Function ' + fn.name + ' is maybe deoptimized'); break;
		case 7: console.log('Function ' + fn.name + ' is optimized by TurboFan'); break;
		default: console.log('Unknown ' + fn.name + ' optimization status: ' + status); break;
	}
}

function createFn (argc) {
	let opts = new Array(argc);
	for (let x = argc; x > 0; x--) {
		opts.push('a' + x);
	}
	opts.push('return ' + (opts.join(' + ') || '0') + ' + Math.random();');
	return new Function(...opts);
}

// nuonce.copied(createFn(3));
// nuonce.copied(createFn(2));
// %OptimizeFunctionOnNextCall(nuonce.copied);
// nuonce.copied(createFn(1));

var fn;
for (let i = 0; i < 3000; ++i) {
	fn = nuonce.stripped(createFn(3));
	for (let j = 0; j < 30; j++) {
		fn(j);
	}
}

printStatus(nuonce.stripped);
printStatus(fn);
