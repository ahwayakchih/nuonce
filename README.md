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
Running inside Docker (Alpine Linux v3.10) with Node v12.5.0 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v5.1.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v2.0.0 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 5,292,657 ops/sec ±1.05% (89 runs sampled)
  once.js                      x 5,165,305 ops/sec ±1.62% (86 runs sampled)
  nuonce.observable            x 4,766,677 ops/sec ±2.39% (88 runs sampled)
  nuonce.observable + callback x 3,713,870 ops/sec ±1.77% (88 runs sampled)
  nuonce.copied                x 3,707,644 ops/sec ±1.06% (90 runs sampled)
  once                         x 3,099,549 ops/sec ±2.34% (85 runs sampled)
  once.strict                  x 2,765,561 ops/sec ±1.61% (86 runs sampled)
  nuonce.copied + callback     x 2,692,752 ops/sec ±1.32% (84 runs sampled)
  nuonce.proxied               x 2,180,027 ops/sec ±1.27% (91 runs sampled)
  nuonce.proxied + callback    x   355,148 ops/sec ±0.90% (93 runs sampled)
  onetime                      x    21,833 ops/sec ±1.19% (82 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.copied                x 304,534 ops/sec ±1.01% (93 runs sampled)
  nuonce.stripped              x 293,547 ops/sec ±0.90% (93 runs sampled)
  nuonce.copied + callback     x 288,689 ops/sec ±1.08% (94 runs sampled)
  once.js                      x 277,206 ops/sec ±1.12% (93 runs sampled)
  nuonce.observable            x 273,599 ops/sec ±0.86% (93 runs sampled)
  nuonce.observable + callback x 249,938 ops/sec ±2.10% (88 runs sampled)
  once                         x 247,504 ops/sec ±1.15% (92 runs sampled)
  nuonce.proxied               x  85,076 ops/sec ±0.64% (94 runs sampled)
  nuonce.proxied + callback    x  62,731 ops/sec ±1.02% (92 runs sampled)
  onetime                      x  19,677 ops/sec ±0.98% (90 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 5,387,172 ops/sec ±1.19% (91 runs sampled)
  once.js                      x 5,327,539 ops/sec ±1.41% (89 runs sampled)
  nuonce.observable            x 4,867,975 ops/sec ±1.38% (86 runs sampled)
  nuonce.observable + callback x 3,612,171 ops/sec ±2.62% (85 runs sampled)
  nuonce.proxied               x 2,198,195 ops/sec ±0.95% (88 runs sampled)
  nuonce.copied                x 1,940,207 ops/sec ±0.68% (93 runs sampled)
  once                         x 1,838,165 ops/sec ±1.21% (91 runs sampled)
  once.strict                  x 1,700,025 ops/sec ±1.31% (89 runs sampled)
  nuonce.copied + callback     x 1,639,711 ops/sec ±0.77% (94 runs sampled)
  nuonce.proxied + callback    x   336,533 ops/sec ±0.92% (94 runs sampled)
  onetime                      x    19,997 ops/sec ±0.90% (91 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 284,594 ops/sec ±0.89% (90 runs sampled)
  nuonce.copied                x 284,484 ops/sec ±1.06% (93 runs sampled)
  once.js                      x 272,109 ops/sec ±1.33% (88 runs sampled)
  nuonce.copied + callback     x 270,262 ops/sec ±0.89% (91 runs sampled)
  nuonce.observable            x 262,064 ops/sec ±0.97% (94 runs sampled)
  nuonce.observable + callback x 248,312 ops/sec ±1.45% (92 runs sampled)
  once                         x 219,139 ops/sec ±1.61% (92 runs sampled)
  nuonce.proxied               x  83,807 ops/sec ±0.67% (91 runs sampled)
  nuonce.proxied + callback    x  68,302 ops/sec ±0.72% (94 runs sampled)
  onetime                      x  18,017 ops/sec ±1.04% (89 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default number of arguments, properties and calls. For example:

```sh
ARGS=2 PROPS=0 CALLS=30 npm run benchmark
```
