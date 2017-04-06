// Run through node with following flags: --trace-deopt --trace-opt --allow-natives-syntax
const nuonces = require('../index.js');
const once = nuonces.stripped;

const reportFiles = process.execArgv.reduce((result, value) => {
	var m = value.match(/^--(?:trace_hydrogen_file|redirect-code-traces-to)=([\w\W]+)$/);
	if (m && m[1]) {
		result.push(m[1]);
	}
	return result;
}, []).join(' and ');

console.log('nuonce properties are ' + (%HasFastProperties(nuonces) ? 'fast' : 'slow'));

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

// Optimize our fn creator so we do not have to check irrelevant deoptimizations
createFn(3);
createFn(2);
%OptimizeFunctionOnNextCall(createFn);
createFn(1);

var fn;
for (let i = 0; i < 3000; ++i) {
	fn = once(createFn(Math.floor(Math.random(4))));
	for (let j = 0; j < 30; j++) {
		fn(j);
	}
}

printStatus(once);
printStatus(fn);

if (reportFiles.length) {
	console.log('You can now visit http://mrale.ph/irhydra/2/.');
	console.log('Upload ' + reportFiles + ' there for further investigation.');
}
