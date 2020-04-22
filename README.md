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
Running inside container (Alpine Linux v3.11) with Node v14.0.0 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 2

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v5.1.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v2.0.1 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 10,061,410 ops/sec ±0.48% (94 runs sampled)
  once.js                      x  9,765,044 ops/sec ±0.50% (92 runs sampled)
  nuonce.observable            x  9,101,236 ops/sec ±0.59% (95 runs sampled)
  nuonce.copied                x  6,855,307 ops/sec ±0.80% (94 runs sampled)
  nuonce.observable + callback x  6,674,704 ops/sec ±0.61% (92 runs sampled)
  once                         x  5,463,649 ops/sec ±0.59% (89 runs sampled)
  nuonce.copied + callback     x  4,824,492 ops/sec ±1.20% (91 runs sampled)
  once.strict                  x  4,520,527 ops/sec ±1.20% (90 runs sampled)
  nuonce.proxied               x  3,821,515 ops/sec ±0.34% (93 runs sampled)
  nuonce.proxied + callback    x    345,128 ops/sec ±0.13% (96 runs sampled)
  onetime                      x     31,810 ops/sec ±0.56% (81 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.copied                x 558,685 ops/sec ±0.38% (94 runs sampled)
  nuonce.stripped              x 539,324 ops/sec ±0.08% (94 runs sampled)
  nuonce.observable            x 502,635 ops/sec ±0.30% (95 runs sampled)
  once.js                      x 493,739 ops/sec ±0.24% (93 runs sampled)
  nuonce.copied + callback     x 486,426 ops/sec ±0.20% (88 runs sampled)
  nuonce.observable + callback x 455,678 ops/sec ±0.09% (96 runs sampled)
  once                         x 432,183 ops/sec ±0.35% (89 runs sampled)
  nuonce.proxied               x 151,666 ops/sec ±0.07% (96 runs sampled)
  nuonce.proxied + callback    x 106,500 ops/sec ±0.07% (95 runs sampled)
  onetime                      x  28,586 ops/sec ±0.32% (83 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 9,983,004 ops/sec ±0.56% (91 runs sampled)
  once.js                      x 9,815,916 ops/sec ±0.83% (93 runs sampled)
  nuonce.observable            x 9,003,366 ops/sec ±0.98% (91 runs sampled)
  nuonce.observable + callback x 6,681,761 ops/sec ±0.62% (93 runs sampled)
  nuonce.proxied               x 3,843,687 ops/sec ±0.57% (91 runs sampled)
  nuonce.copied                x 2,752,787 ops/sec ±0.73% (93 runs sampled)
  once                         x 2,583,380 ops/sec ±1.47% (86 runs sampled)
  once.strict                  x 2,338,671 ops/sec ±0.79% (90 runs sampled)
  nuonce.copied + callback     x 2,283,224 ops/sec ±0.75% (91 runs sampled)
  nuonce.proxied + callback    x   355,729 ops/sec ±0.11% (90 runs sampled)
  onetime                      x    30,708 ops/sec ±0.56% (83 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 528,908 ops/sec ±0.24% (95 runs sampled)
  once.js                      x 495,674 ops/sec ±0.08% (94 runs sampled)
  nuonce.copied                x 492,871 ops/sec ±0.24% (92 runs sampled)
  nuonce.observable            x 487,955 ops/sec ±0.09% (96 runs sampled)
  nuonce.observable + callback x 455,361 ops/sec ±0.18% (95 runs sampled)
  nuonce.copied + callback     x 430,092 ops/sec ±0.08% (87 runs sampled)
  once                         x 391,466 ops/sec ±0.26% (88 runs sampled)
  nuonce.proxied               x 144,857 ops/sec ±0.07% (93 runs sampled)
  nuonce.proxied + callback    x 104,169 ops/sec ±0.07% (95 runs sampled)
  onetime                      x  27,476 ops/sec ±0.30% (88 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default number of arguments, properties and calls. For example:

```sh
ARGS=2 PROPS=0 CALLS=30 npm run benchmark
```
