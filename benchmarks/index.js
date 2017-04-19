const benchmark = require('benchmark').Suite;
const results   = require('beautify-benchmark');
const once      = require('once');
const oncejs    = require('once.js/once.min.js');
const onetime   = require('onetime');
const os        = require('os');
const nuonce    = require('../index.js');
const support   = require('../test/support/fn.js');

if (process.env.INFO) {
	logInfo(['once', 'once.js', 'onetime', '..']);
}

const args = parseInt(process.env.ARGS || '1', 10);
const props = parseInt(process.env.PROPS || '0', 10);
const multiple = parseInt(process.env.CALLS || '1', 10);

const test = benchmark('nuonce');
const testTarget = support.createFn(args, props);

test.add('once.js', function () {
	var f = oncejs(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('onetime', function () {
	var f = onetime(testTarget, false);
	return support.repeatFn(f, args, multiple);
});

test.add('once', function () {
	var f = once(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.stripped', function () {
	var f = nuonce.stripped(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.copied', function () {
	var f = nuonce.copied(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.copied + called', function () {
	var t = testTarget;
	var f = nuonce.copied(function () {
		f.value = t.apply(this, arguments);
		f.called = true;
	});
	f.called = false;
	return support.repeatFn(f, args, multiple);
});

/*
 * Disable `mirrored` because it is useless:
 * it's speed is ok only without custom properties,
 * otherwise it is horribly slow (even just one custom property)...
 * Since the only use case for it, is with properties it is practically useless.
 */
// test.add('nuonce.mirrored', function () {
// 	var f = nuonce.mirrored(testTarget);
// 	return support.repeatFn(f, args, multiple);
// });

test.add('nuonce.proxied', function () {
	var f = nuonce.proxied(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.on('start', function () {
	const times = `${multiple} time` + (multiple === 1 ? '' : 's');
	const values = `${args} argument` + (args === 1 ? '' : 's');
	const properties = `${props} propert` + (props === 1 ? 'y' : 'ies');

	console.log(`Test function with ${properties}, called ${times} with ${values}`);
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
 * Show info about environment and compared packages.
 *
 * @private
 */
function logInfo (packages) {
	console.log(`Running on node ${process.version} with ${os.cpus()[0].model} x ${os.cpus().length}`);
	console.log('');
	console.log('Testing:');

	var columns = columnsCreate(['name', 'version', 'homepage']);

	var rows = packages.map(name => {
		var row = require(name + '/package.json');
		row.version = 'v' + row.version;
		columnsUpdate(columns, row);
		return row;
	});

	rows.forEach(row => {
		console.log('- ' + columnsText(columns, row));
	});

	console.log('');

	function columnsCreate (names) {
		return names.map(function (name) {
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
