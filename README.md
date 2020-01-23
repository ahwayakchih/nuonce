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
Running inside container (Alpine Linux v3.11) with Node v13.7.0 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 2

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v5.1.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v2.0.1 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  11 tests completed.

  once.js                      x 9,926,758 ops/sec ±0.82% (92 runs sampled)
  nuonce.stripped              x 9,812,132 ops/sec ±0.80% (89 runs sampled)
  nuonce.observable            x 9,271,716 ops/sec ±0.83% (94 runs sampled)
  nuonce.copied                x 7,049,162 ops/sec ±0.65% (91 runs sampled)
  nuonce.observable + callback x 6,523,306 ops/sec ±0.66% (92 runs sampled)
  once                         x 5,463,721 ops/sec ±0.62% (90 runs sampled)
  nuonce.copied + callback     x 4,938,831 ops/sec ±0.77% (89 runs sampled)
  once.strict                  x 4,455,973 ops/sec ±0.40% (92 runs sampled)
  nuonce.proxied               x 3,777,185 ops/sec ±0.40% (91 runs sampled)
  nuonce.proxied + callback    x   390,073 ops/sec ±0.21% (90 runs sampled)
  onetime                      x    32,316 ops/sec ±0.60% (78 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 526,679 ops/sec ±0.15% (94 runs sampled)
  nuonce.copied                x 522,938 ops/sec ±0.30% (96 runs sampled)
  once.js                      x 496,864 ops/sec ±0.45% (94 runs sampled)
  nuonce.observable            x 486,700 ops/sec ±0.08% (94 runs sampled)
  nuonce.copied + callback     x 459,943 ops/sec ±0.30% (89 runs sampled)
  nuonce.observable + callback x 452,772 ops/sec ±0.24% (95 runs sampled)
  once                         x 430,434 ops/sec ±0.32% (89 runs sampled)
  nuonce.proxied + callback    x 109,549 ops/sec ±0.08% (95 runs sampled)
  nuonce.proxied               x 103,650 ops/sec ±0.15% (91 runs sampled)
  onetime                      x  28,933 ops/sec ±0.34% (84 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 9,682,444 ops/sec ±0.34% (89 runs sampled)
  once.js                      x 9,414,667 ops/sec ±0.71% (89 runs sampled)
  nuonce.observable            x 9,079,109 ops/sec ±0.52% (94 runs sampled)
  nuonce.observable + callback x 6,395,933 ops/sec ±0.34% (92 runs sampled)
  nuonce.proxied               x 3,741,799 ops/sec ±0.37% (92 runs sampled)
  nuonce.copied                x 2,745,449 ops/sec ±0.54% (88 runs sampled)
  once                         x 2,637,219 ops/sec ±0.62% (85 runs sampled)
  nuonce.copied + callback     x 2,420,961 ops/sec ±0.50% (90 runs sampled)
  once.strict                  x 2,365,081 ops/sec ±0.41% (93 runs sampled)
  nuonce.proxied + callback    x   381,100 ops/sec ±0.13% (88 runs sampled)
  onetime                      x    30,988 ops/sec ±0.46% (83 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 530,258 ops/sec ±0.11% (95 runs sampled)
  nuonce.observable            x 495,615 ops/sec ±0.08% (95 runs sampled)
  once.js                      x 493,138 ops/sec ±0.32% (94 runs sampled)
  nuonce.copied                x 456,348 ops/sec ±0.39% (95 runs sampled)
  nuonce.observable + callback x 455,606 ops/sec ±0.21% (95 runs sampled)
  nuonce.copied + callback     x 410,924 ops/sec ±0.08% (87 runs sampled)
  once                         x 391,312 ops/sec ±0.28% (89 runs sampled)
  nuonce.proxied               x 129,402 ops/sec ±0.11% (95 runs sampled)
  nuonce.proxied + callback    x 102,327 ops/sec ±0.21% (96 runs sampled)
  onetime                      x  27,863 ops/sec ±0.24% (88 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default number of arguments, properties and calls. For example:

```sh
ARGS=2 PROPS=0 CALLS=30 npm run benchmark
```
