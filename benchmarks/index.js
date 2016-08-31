const benchmark = require('benchmark').Suite;
const results   = require('beautify-benchmark');
const once      = require('once');
const oncejs    = require('once.js/once.min.js');
const onetime   = require('onetime');
const os        = require('os');
const nuonce    = require('../index.js');

if (process.env.INFO) {
	logInfo();
}

const args = parseInt(process.env.ARGS || '1', 10);
const props = parseInt(process.env.PROPS || '0', 10);
const multiple = parseInt(process.env.CALLS || '1', 10);

const targetsWithProps = {};

const test = benchmark('nuonce');

test.add('once', function () {
	var f = once(prepareTestTarget(props));
	return simulateRepeatedCalls(f, args, multiple);
});

test.add('once.js', function () {
	var f = oncejs(prepareTestTarget(props));
	return simulateRepeatedCalls(f, args, multiple);
});

test.add('onetime', function () {
	var f = onetime(prepareTestTarget(props), false);
	return simulateRepeatedCalls(f, args, multiple);
});

test.add('nuonce.stripped', function () {
	var f = nuonce.stripped(prepareTestTarget(props));
	return simulateRepeatedCalls(f, args, multiple);
});

test.add('nuonce.copied', function () {
	var f = nuonce.copied(prepareTestTarget(props));
	return simulateRepeatedCalls(f, args, multiple);
});

test.add('nuonce.copied + called', function () {
	var t = prepareTestTarget(props);
	var f = nuonce.copied(function () {
		f.value = t.apply(this, arguments);
		f.called = true;
	});
	f.called = false;
	return simulateRepeatedCalls(f, args, multiple);
});

/*
 * Disable `mirrored` because it is useless:
 * it's speed is ok only without custom properties,
 * otherwise it is horribly slow (even just one custom property)...
 * Since the only use case for it, is with properties it is practically useless.
 */
// test.add('nuonce.mirrored', function () {
// 	var f = nuonce.mirrored(prepareTestTarget(props));
// 	return simulateRepeatedCalls(f, args, multiple);
// });

if (nuonce.proxied) {
	test.add('nuonce.proxied', function () {
		var f = nuonce.proxied(prepareTestTarget(props));
		return simulateRepeatedCalls(f, multiple);
	});
}

test.on('start', function () {
	const times = `${multiple} time` + (multiple > 1 ? 's' : '');
	const values = `${args} argument` + (args > 1 ? 's' : '');

	console.log(`Test function with ${props} properties, called ${times} with ${values}`);
	console.log('');
});

test.on('cycle', function (event) {
	results.add(event.target);
});

test.on('complete', function () {
	results.store.sort((a, b) => b.hz - a.hz);
	results.log();
});

test.run({
	async: false
});

/**
 * Show info about environment and tested packages.
 *
 * @private
 */
function logInfo () {
	console.log(`Running on node ${process.version} with ${os.cpus()[0].model} x ${os.cpus().length}`);
	console.log('');
	console.log('Testing:');

	var columns = columnsCreate(['name', 'version', 'homepage']);

	var infoOnce = require('once/package.json');
	infoOnce.version = 'v' + infoOnce.version;
	columnsUpdate(columns, infoOnce);

	var infoOnceJS = require('once.js/package.json');
	infoOnceJS.version = 'v' + infoOnceJS.version;
	columnsUpdate(columns, infoOnceJS);

	var infoOnetime = require('onetime/package.json');
	infoOnetime.version = 'v' + infoOnetime.version;
	columnsUpdate(columns, infoOnetime);

	var infoNuonce = require('../package.json');
	infoNuonce.version = 'v' + infoNuonce.version;
	columnsUpdate(columns, infoNuonce);

	console.log('- ' + columnsText(columns, infoOnce));
	console.log('- ' + columnsText(columns, infoOnceJS));
	console.log('- ' + columnsText(columns, infoOnetime));
	console.log('- ' + columnsText(columns, infoNuonce));
	console.log('');

	function columnsCreate (names) {
		return names.map(name => {
			return {size: 0, source: name};
		});
	}

	function columnsUpdate (columns, info) {
		var size;
		var col;
		for (var i = 0; i < columns.length; i++) {
			col = columns[i];
			size = (info[col.source] && info[col.source].length) || 0;
			if (info[col.source] && (size = info[col.source].length) && size > col.size) {
				col.size = size;
			}
		}
	}

	function columnsText (columns, info) {
		var result = '';

		for (var i = 0; i < columns.length; i++) {
			result += columnText(columns[i], info);
			result += ' ';
		}

		return result + ' ';
	}

	function columnText (column, info) {
		var value = info[column.source] || '';
		var padSize = column.size - value.length;
		var pad = '';

		if (padSize) {
			pad += (new Array(padSize + 1)).join(' ');
		}

		return value + pad;
	}
}

/**
 * Create function to be passed to tested once/nuonce.
 * Create `numberOfProperties` number of properties on it. Each one will be just a reference
 * to `Math.random` function (so it will be callable too).
 *
 * @param {number} numberOfProperties
 * @return {Function}
 */
function prepareTestTarget (numberOfProperties) {
	var result = numberOfProperties && targetsWithProps[numberOfProperties];

	if (result) {
		return result;
	}

	result = function (a) {
		// Return something stupid that cannot be simply optimized to a static value
		return (Math.random() * a) + numberOfProperties;
	};

	if (!numberOfProperties) {
		return result;
	}

	var key = 'foo' + Math.random();
	result[key] = Math.random;

	for (var i = 1; i < numberOfProperties; i++) {
		key = 'foo' + Math.random();
		result[key] = Math.random;
	}

	targetsWithProps[numberOfProperties] = result;

	return result;
}

/**
 * Call given function multiple times, call its `foo0` method too (if available).
 *
 * @param {Function} f
 * @param {number}   multiple
 * @return {boolean}
 */
function simulateRepeatedCalls (f, args, multiple) {
	var result;

	var i;
	var argv = new Array(args);
	for (i = args - 1; i > -1; i--) {
		args[i] = Math.random();
	}

	for (i = 0; i < multiple; i++) {
		result = result && f.apply(this, argv) && props && f.foo();
	}

	return result;
}
