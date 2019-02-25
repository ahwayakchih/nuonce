const benchmark  = require('benchmark').Suite;
const results    = require('beautify-benchmark');
const once       = require('once');
const oncejs     = require('once.js/once.min.js');
const onetime    = require('onetime');
const os         = require('os');
const support    = require('../test/support/fn.js');

const stripped   = require('../stripped.js');
const observable = require('../observable.js');
const copied     = require('../copied.js');
const proxied    = require('../proxied.js');

if (process.env.INFO) {
	logInfo(['once', 'once.js', 'onetime', '..']);
}

const args = parseInt(process.env.ARGS || '1', 10);
const props = parseInt(process.env.PROPS || '0', 10);
const multiple = parseInt(process.env.CALLS || '1', 10);

const test = benchmark('nuonce');
const testTarget = support.createFn(args, props);

test.add('_warmup', function () {
	return support.repeatFn(function () { return {}; }, args, multiple);
});

test.add('once.js', function () {
	var f = oncejs(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('once', function () {
	var f = once(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.stripped', function () {
	var f = stripped(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.observable', function () {
	var f = observable(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.observable + callback', function () {
	var f = observable(testTarget, function (status) {
		status.cb = null;
		f.called = status.calls;
		return f.value = status.value;
	});
	f.called = 0;
	f.value = undefined;
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.copied', function () {
	var f = copied(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.copied + callback', function () {
	var f = copied(testTarget, function (status) {
		status.cb = null;
		f.called = status.calls;
		return f.value = status.value;
	});
	f.called = 0;
	f.value = undefined;
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.proxied', function () {
	var f = proxied(testTarget);
	return support.repeatFn(f, args, multiple);
});

test.add('nuonce.proxied + callback', function () {
	var f = proxied(testTarget, function (status) {
		status.cb = null;
		f.called = status.calls;
		return f.value = status.value;
	});
	f.called = 0;
	f.value = undefined;
	return support.repeatFn(f, args, multiple);
});

// Run `onetime` last - it's results are the same no matter if it's tested
// first, last or in the middle, but it does impact other results by lowering 
// them all. By keeping it last comparison is same, but highscores are not impacted.
test.add('onetime', function () {
	var f = onetime(testTarget, false);
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
	if (event.target.name !== '_warmup') {
		results.add(event.target);
	}
	else if (process.stdout && process.stdout.isTTY) {
		process.stdout.write('   warmup finished.\u000D');
	}

	if (typeof global.gc === 'function') {	
		global.gc();
	}
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
	var docker = (function checkDocker () {
		const fs = require('fs');
		try {
			return fs.readFileSync('/proc/self/cgroup', 'utf8').indexOf('/docker/') !== -1
				&& (fs.readFileSync('/etc/os-release', 'utf8').match(/PRETTY_NAME="([^"]+)"/) || [,'unknown'])[1]
		}
		catch (e) {
			return false;
		}
	})();
	var where = docker ? `inside Docker (${docker})` : `natively (${os.release()})`;
	console.log(`Running ${where} with Node ${process.version} and ${os.cpus()[0].model} x ${os.cpus().length}`);
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

	// Final "margin", before test results
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
