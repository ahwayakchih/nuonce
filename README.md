nuonce
======

Yet another implementation of `once` - a function wrapper that will call a target function just once. Every other call after the first one will return result from the first call.

It provides just a few methods. Each one results in a function better resembling a target than the previous one, for an additional cost in speed.

`nuonce.stripped` is for use when target functions do not have any custom properties, or when those properties are not needed to be accessible on the returned function. It is A LOT faster than any of the other methods and seems to be a good replacement for popular [`once`](https://github.com/isaacs/once) module in most use cases.

`nuonce.observable` supports additional `cb` argument that, if provided, must be a function. It will be called every time "nuonced" function is called. It can be used to implement additional stuff, like `called` and `value` properties created by `once` module, or to throw an error, like with `once.strict` or [`onetime`](https://github.com/sindresorhus/onetime) module. All the while running faster than those other modules.

`nuonce.copied` gives comparable results to the one returned by `once` module, only slightly faster and with the same `length` as target function, but without custom `called` and `value` properties (unless `cb` that implements them is provided, but then it costs additional speed).

`nuonce.proxied` returns callable object ([ES6 Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy)) that provides access to all of custom properties and methods of a target function, including those added in future (after "nuonced" version was returned).

Nuonce is meant to be used in Node.js applications. Although it may work in web browsers, it is tested and optimized for Node.js (with V8 engine).


## Installation

```sh
npm install nuonce
```

or:

```sh
npm install https://github.com/ahwayakchih/nuonce
```


## Usage

Some example uses:

```js
const nuonce = require('nuonce');

const target = function (a, b, c) {
  console.log('called with:', a, b, c);
  return Math.random();
}
target.foo = 42;

// When custom properties and keeping function `length` are not needed:
var f = nuonce.stripped(target);
f.length;    // 0
f.foo;       // undefined
f(1, 2, 3);  // called with: 1, 2, 3
f() === f(); // true

// When custom properties and keeping function `length` are not needed,
// but additional `called` is:
var f = nuonce.observable(target, status => {
  f.called = status.calls;
  return status.value;
});
f.length;      // 0
f.foo;         // undefined
f(1, 2, 3);    // called with: 1, 2, 3
f.called === 1;// true
f() === f();   // true
f.called === 3;// true

// When properties can be just copied:
var f = nuonce.copied(target);
target.foo = 142;
f.length;    // 3
f.foo;       // 42
f(1, 2, 3);  // called with: 1, 2, 3
f() === f(); // true

// When properties should always be kept up-to-date:
var f = nuonce.proxied(target);
target.foo = 242;
f.length;    // 3
f.foo;       // 242
f(1, 2, 3);  // called with: 1, 2, 3
f() === f(); // true
```


## Compatibility

Nuonce is compatible with `once` module for most use cases found in Node.js projects, i.e., when none of `called` or `value` properties set on "onced" function are used.

Usually, `once` is called on a function that does not have any custom properties (or they are not accessed through "onced" version of that function anyway), e.g., "`cb`" or "`callback`" functions passed to asynchronous tasks. In those cases `nuonce.stripped` will give a lot of speedup without sacrificing anything.

In cases when `called` or `value` propety is needed, you can use custom callback to set them up. For example:

```js
function target () {
  return 'I am here!';
}

// Using "once" module
const once = require('once');

var f = once.strict(target);

f();
if (f.called) {
  // do something with f.value
}

// Using "nuonce" module
const nuonce = require('nuonce/copied');

var f = nuonce(target, function onTargetCalled (status) {
  if (status.calls > 1) throw new Error('Do not call this multiple times');
  f.called = true;
  return f.value = status.value;
});
f.called = false;
f.value = undefined;

f();
if (f.called) {
  // do something with f.value
}
```

With additional wrapper to set the `called` property, `nuonce.copied` runs slower than `once` and code is less convenient to write. If you really need to use the `called` property often, it probably will be better to stick with the `once` module. Unless you want `called` property, but do not need properties of original function. In which case `nuonce.observable` with additional callback is faster than `once` but less convenient to write.

For browser use, it may be easier to just use the [`once.js`](https://github.com/daniellmb/once.js) module, although only in cases where `nuonce.stripped` could be used (both are implemented almost exactly the same way, but `once.js` seems to outerform everything).


## Benchmarks

Some benchmarks results for comparison (you can re-run them locally with: `npm run benchmarks`, after running `npm install --no-shrinkwrap`):

```markdown
Running inside Docker (Alpine Linux v3.10) with Node v12.11.0 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v5.1.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v2.0.0 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  11 tests completed.

  once.js                      x 9,037,425 ops/sec ±1.63% (87 runs sampled)
  nuonce.stripped              x 8,929,933 ops/sec ±1.71% (87 runs sampled)
  nuonce.observable            x 8,059,565 ops/sec ±1.67% (85 runs sampled)
  nuonce.observable + callback x 5,861,309 ops/sec ±1.76% (87 runs sampled)
  nuonce.copied                x 5,592,750 ops/sec ±1.88% (85 runs sampled)
  once                         x 4,784,948 ops/sec ±1.97% (82 runs sampled)
  nuonce.copied + callback     x 4,382,911 ops/sec ±1.67% (88 runs sampled)
  once.strict                  x 4,151,867 ops/sec ±1.69% (89 runs sampled)
  nuonce.proxied               x 3,550,495 ops/sec ±1.68% (90 runs sampled)
  nuonce.proxied + callback    x   361,850 ops/sec ±0.62% (94 runs sampled)
  onetime                      x    31,176 ops/sec ±0.80% (77 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 506,723 ops/sec ±1.21% (90 runs sampled)
  once.js                      x 479,157 ops/sec ±1.37% (89 runs sampled)
  nuonce.copied                x 476,219 ops/sec ±1.53% (89 runs sampled)
  nuonce.observable            x 474,967 ops/sec ±0.93% (92 runs sampled)
  nuonce.observable + callback x 443,691 ops/sec ±1.28% (91 runs sampled)
  nuonce.copied + callback     x 417,030 ops/sec ±1.26% (86 runs sampled)
  once                         x 404,551 ops/sec ±1.66% (86 runs sampled)
  nuonce.proxied               x 131,859 ops/sec ±0.91% (90 runs sampled)
  nuonce.proxied + callback    x 107,185 ops/sec ±0.80% (86 runs sampled)
  onetime                      x  28,100 ops/sec ±0.63% (85 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  11 tests completed.

  once.js                      x 9,262,687 ops/sec ±1.02% (91 runs sampled)
  nuonce.stripped              x 8,724,365 ops/sec ±1.59% (90 runs sampled)
  nuonce.observable            x 8,079,845 ops/sec ±1.47% (90 runs sampled)
  nuonce.observable + callback x 5,702,486 ops/sec ±1.41% (86 runs sampled)
  nuonce.proxied               x 3,550,836 ops/sec ±1.41% (88 runs sampled)
  nuonce.copied                x 2,719,775 ops/sec ±1.68% (89 runs sampled)
  once                         x 2,472,817 ops/sec ±1.69% (84 runs sampled)
  once.strict                  x 2,334,729 ops/sec ±1.28% (87 runs sampled)
  nuonce.copied + callback     x 2,156,149 ops/sec ±1.17% (88 runs sampled)
  nuonce.proxied + callback    x   371,343 ops/sec ±0.37% (95 runs sampled)
  onetime                      x    29,830 ops/sec ±0.62% (82 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 507,083 ops/sec ±1.78% (89 runs sampled)
  nuonce.observable            x 473,043 ops/sec ±1.60% (88 runs sampled)
  once.js                      x 458,043 ops/sec ±1.71% (88 runs sampled)
  nuonce.observable + callback x 447,965 ops/sec ±1.20% (88 runs sampled)
  nuonce.copied                x 415,497 ops/sec ±1.61% (90 runs sampled)
  nuonce.copied + callback     x 380,653 ops/sec ±1.09% (86 runs sampled)
  once                         x 363,043 ops/sec ±1.69% (84 runs sampled)
  nuonce.proxied               x 145,660 ops/sec ±0.81% (90 runs sampled)
  nuonce.proxied + callback    x 103,479 ops/sec ±0.88% (91 runs sampled)
  onetime                      x  26,735 ops/sec ±0.31% (86 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default number of arguments, properties and calls. For example:

```sh
ARGS=2 PROPS=0 CALLS=30 npm run benchmark
```
