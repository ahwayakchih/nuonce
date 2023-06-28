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

*Note: while `nuonce` can probably still run in Node.js as old as 6.9, benchmarks and tests require at least v14.* 

```markdown
Running inside container (Alpine Linux v3.18) with Node v18.16.1 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 2

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v6.0.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v2.0.1 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 8,377,280 ops/sec ±0.21% (92 runs sampled)
  once.js                      x 8,367,015 ops/sec ±0.26% (88 runs sampled)
  nuonce.observable            x 7,678,453 ops/sec ±0.21% (93 runs sampled)
  nuonce.copied                x 6,081,398 ops/sec ±0.34% (95 runs sampled)
  nuonce.observable + callback x 5,872,795 ops/sec ±0.18% (92 runs sampled)
  once                         x 4,783,971 ops/sec ±0.49% (88 runs sampled)
  nuonce.copied + callback     x 4,775,697 ops/sec ±0.29% (93 runs sampled)
  once.strict                  x 3,980,441 ops/sec ±0.17% (93 runs sampled)
  nuonce.proxied               x 3,549,031 ops/sec ±0.13% (94 runs sampled)
  nuonce.proxied + callback    x   369,444 ops/sec ±0.22% (93 runs sampled)
  onetime                      x    79,023 ops/sec ±0.74% (89 runs sampled)


Test function with 0 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 508,103 ops/sec ±0.21% (94 runs sampled)
  nuonce.copied                x 505,040 ops/sec ±0.28% (89 runs sampled)
  once.js                      x 504,693 ops/sec ±0.21% (93 runs sampled)
  nuonce.observable            x 477,380 ops/sec ±0.23% (96 runs sampled)
  nuonce.copied + callback     x 465,862 ops/sec ±0.13% (95 runs sampled)
  nuonce.observable + callback x 463,619 ops/sec ±0.26% (91 runs sampled)
  once                         x 439,328 ops/sec ±0.42% (88 runs sampled)
  nuonce.proxied               x 146,797 ops/sec ±0.14% (93 runs sampled)
  nuonce.proxied + callback    x  98,983 ops/sec ±0.17% (91 runs sampled)
  onetime                      x  61,114 ops/sec ±0.55% (93 runs sampled)


Test function with 3 properties, called 1 time with 1 argument

  11 tests completed.

  nuonce.stripped              x 8,652,826 ops/sec ±0.34% (92 runs sampled)
  once.js                      x 8,524,248 ops/sec ±0.44% (92 runs sampled)
  nuonce.observable            x 7,927,410 ops/sec ±0.26% (92 runs sampled)
  nuonce.observable + callback x 5,975,545 ops/sec ±0.21% (92 runs sampled)
  nuonce.proxied               x 3,454,379 ops/sec ±0.14% (93 runs sampled)
  nuonce.copied                x 2,565,246 ops/sec ±0.17% (94 runs sampled)
  once                         x 2,262,805 ops/sec ±0.37% (90 runs sampled)
  nuonce.copied + callback     x 2,184,450 ops/sec ±0.76% (94 runs sampled)
  once.strict                  x 2,089,327 ops/sec ±0.16% (91 runs sampled)
  nuonce.proxied + callback    x   370,874 ops/sec ±0.23% (92 runs sampled)
  onetime                      x    71,770 ops/sec ±0.69% (91 runs sampled)


Test function with 3 properties, called 50 times with 1 argument

  10 tests completed.

  nuonce.stripped              x 515,852 ops/sec ±0.19% (95 runs sampled)
  once.js                      x 504,774 ops/sec ±0.26% (94 runs sampled)
  nuonce.observable            x 488,056 ops/sec ±0.23% (94 runs sampled)
  nuonce.observable + callback x 463,799 ops/sec ±0.25% (90 runs sampled)
  nuonce.copied                x 442,438 ops/sec ±0.13% (93 runs sampled)
  nuonce.copied + callback     x 416,070 ops/sec ±0.51% (89 runs sampled)
  once                         x 400,605 ops/sec ±0.64% (91 runs sampled)
  nuonce.proxied               x 141,235 ops/sec ±0.14% (92 runs sampled)
  nuonce.proxied + callback    x  98,343 ops/sec ±0.15% (93 runs sampled)
  onetime                      x  58,426 ops/sec ±0.49% (93 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default number of arguments, properties and calls. For example:

```sh
ARGS=2 PROPS=0 CALLS=30 npm run benchmark
```
