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
Running inside Docker (Alpine Linux v3.9) with Node v11.12.0 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v5.0.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v2.0.0 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 5,386,686 ops/sec ±0.90% (89 runs sampled)
  once.js                      x 5,282,024 ops/sec ±0.78% (85 runs sampled)
  nuonce.observable            x 4,944,359 ops/sec ±0.83% (89 runs sampled)
  nuonce.observable + callback x 3,137,474 ops/sec ±0.93% (87 runs sampled)
  nuonce.copied                x 2,796,992 ops/sec ±0.64% (84 runs sampled)
  once                         x 2,709,327 ops/sec ±0.62% (87 runs sampled)
  once.strict                  x 2,133,285 ops/sec ±1.09% (86 runs sampled)
  nuonce.copied + callback     x 1,917,394 ops/sec ±0.67% (87 runs sampled)
  nuonce.proxied               x 1,816,083 ops/sec ±0.58% (85 runs sampled)
  nuonce.proxied + callback    x   240,551 ops/sec ±0.64% (89 runs sampled)
  onetime                      x    15,847 ops/sec ±2.78% (81 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 308,123 ops/sec ±1.11% (86 runs sampled)
  once.js                      x 298,055 ops/sec ±0.57% (89 runs sampled)
  nuonce.copied                x 289,717 ops/sec ±1.07% (89 runs sampled)
  nuonce.observable            x 278,159 ops/sec ±0.89% (90 runs sampled)
  nuonce.observable + callback x 272,256 ops/sec ±0.73% (89 runs sampled)
  nuonce.copied + callback     x 265,359 ops/sec ±0.51% (89 runs sampled)
  once                         x 256,421 ops/sec ±0.68% (89 runs sampled)
  nuonce.proxied               x  72,729 ops/sec ±0.89% (89 runs sampled)
  nuonce.proxied + callback    x  56,441 ops/sec ±0.55% (89 runs sampled)
  onetime                      x  14,886 ops/sec ±1.65% (84 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 5,511,026 ops/sec ±0.78% (90 runs sampled)
  once.js                      x 5,292,338 ops/sec ±0.63% (87 runs sampled)
  nuonce.observable            x 4,918,433 ops/sec ±0.77% (89 runs sampled)
  nuonce.observable + callback x 3,069,922 ops/sec ±1.03% (85 runs sampled)
  nuonce.proxied               x 1,778,107 ops/sec ±0.94% (87 runs sampled)
  once                         x 1,549,664 ops/sec ±0.90% (85 runs sampled)
  nuonce.copied                x 1,473,977 ops/sec ±0.96% (87 runs sampled)
  once.strict                  x 1,351,305 ops/sec ±0.64% (86 runs sampled)
  nuonce.copied + callback     x 1,173,364 ops/sec ±0.70% (87 runs sampled)
  nuonce.proxied + callback    x   242,080 ops/sec ±1.28% (90 runs sampled)
  onetime                      x    14,733 ops/sec ±1.83% (86 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 311,054 ops/sec ±0.99% (87 runs sampled)
  once.js                      x 295,963 ops/sec ±0.89% (88 runs sampled)
  nuonce.observable            x 278,583 ops/sec ±0.63% (90 runs sampled)
  nuonce.copied                x 276,765 ops/sec ±0.58% (89 runs sampled)
  nuonce.observable + callback x 271,501 ops/sec ±0.77% (90 runs sampled)
  nuonce.copied + callback     x 251,936 ops/sec ±0.53% (85 runs sampled)
  once                         x 240,971 ops/sec ±1.16% (86 runs sampled)
  nuonce.proxied               x  72,541 ops/sec ±0.87% (91 runs sampled)
  nuonce.proxied + callback    x  56,946 ops/sec ±0.58% (89 runs sampled)
  onetime                      x  13,355 ops/sec ±1.79% (83 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default number of arguments, properties and calls. For example:

```sh
ARGS=2 PROPS=0 CALLS=30 npm run benchmark
```
