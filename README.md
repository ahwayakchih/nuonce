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
Running inside Docker (Alpine Linux v3.9) with Node v11.10.0 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v3.0.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v2.0.0 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  10 tests completed.

  nuonce.stripped              x 8,918,265 ops/sec ±1.48% (87 runs sampled)
  once.js                      x 8,642,668 ops/sec ±0.78% (87 runs sampled)
  nuonce.observable            x 8,170,038 ops/sec ±1.05% (93 runs sampled)
  nuonce.observable + callback x 5,081,595 ops/sec ±1.40% (89 runs sampled)
  nuonce.copied                x 4,949,237 ops/sec ±1.37% (92 runs sampled)
  once                         x 4,441,684 ops/sec ±1.29% (92 runs sampled)
  nuonce.copied + callback     x 3,402,504 ops/sec ±1.32% (87 runs sampled)
  nuonce.proxied               x 2,967,702 ops/sec ±1.17% (91 runs sampled)
  nuonce.proxied + callback    x   362,123 ops/sec ±0.69% (94 runs sampled)
  onetime                      x    24,325 ops/sec ±2.56% (85 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 474,269 ops/sec ±0.62% (92 runs sampled)
  once.js                      x 452,859 ops/sec ±1.06% (91 runs sampled)
  nuonce.observable            x 415,837 ops/sec ±1.30% (89 runs sampled)
  nuonce.copied + callback     x 404,862 ops/sec ±1.01% (92 runs sampled)
  nuonce.copied                x 403,680 ops/sec ±1.02% (85 runs sampled)
  nuonce.observable + callback x 400,330 ops/sec ±1.05% (89 runs sampled)
  once                         x 387,100 ops/sec ±1.32% (86 runs sampled)
  nuonce.proxied               x 114,647 ops/sec ±0.54% (92 runs sampled)
  nuonce.proxied + callback    x  88,596 ops/sec ±0.83% (90 runs sampled)
  onetime                      x  22,324 ops/sec ±2.33% (83 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  10 tests completed.

  nuonce.stripped              x 8,987,505 ops/sec ±1.07% (88 runs sampled)
  once.js                      x 8,624,100 ops/sec ±1.08% (92 runs sampled)
  nuonce.observable            x 8,148,109 ops/sec ±1.24% (93 runs sampled)
  nuonce.observable + callback x 5,114,911 ops/sec ±0.97% (92 runs sampled)
  nuonce.proxied               x 3,052,035 ops/sec ±0.91% (88 runs sampled)
  once                         x 2,660,367 ops/sec ±1.14% (92 runs sampled)
  nuonce.copied                x 2,641,543 ops/sec ±0.77% (91 runs sampled)
  nuonce.copied + callback     x 2,104,329 ops/sec ±0.96% (91 runs sampled)
  nuonce.proxied + callback    x   370,587 ops/sec ±0.83% (93 runs sampled)
  onetime                      x    22,266 ops/sec ±1.54% (84 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 475,490 ops/sec ±1.04% (90 runs sampled)
  once.js                      x 453,441 ops/sec ±1.07% (91 runs sampled)
  nuonce.observable            x 423,465 ops/sec ±0.92% (91 runs sampled)
  nuonce.observable + callback x 405,974 ops/sec ±0.96% (89 runs sampled)
  once                         x 379,291 ops/sec ±0.98% (86 runs sampled)
  nuonce.copied + callback     x 374,247 ops/sec ±1.02% (92 runs sampled)
  nuonce.copied                x 371,436 ops/sec ±0.93% (85 runs sampled)
  nuonce.proxied               x 115,628 ops/sec ±0.72% (93 runs sampled)
  nuonce.proxied + callback    x  89,764 ops/sec ±0.90% (91 runs sampled)
  onetime                      x  20,542 ops/sec ±2.07% (84 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default number of arguments, properties and calls. For example:

```sh
ARGS=2 PROPS=0 CALLS=30 npm run benchmark
```
