nuonce
======

Yet another implementation of `once` - a function wrapper that will call a target function just once. Every other call after the first one will return result from the first call.

It provides a few methods. Each one results in a function better resembling a target than the previous one, for a cost of speed.

`nuonce.stripped` is for use when target functions do not have any custom properties, or when those properties are not needed to be accessible on the returned function. It is A LOT faster than any of the other methods and seems to be a good replacement for popular [`once`](https://github.com/isaacs/once) module in most of common use cases.

`nuonce.copied` gives comparable result to the ones returned by `once` module, only slightly faster and with the same `length` as target function, but without setting custom `called` and `value` properties on returned function.

`nuonce.proxied` returns callable object ([ES6 Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy)) that provides access to all of custom properties and methods of a target function, including those added in future (after "nuonced" version was returned).

Nuonce is meant to be used in Node.js applications. Although it may work in web browsers (at least `nuonce.stripped` should work), it is tested and optimized for Node.js (with V8 engine).


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

Nuonce is compatible with `once` module for most of use cases found in Node.js projects, i.e., when none of `called` or `value` properties set on "onced" function are used.

Usually, `once` is called on a function that does not have any custom properties (or they are not accessed through "onced" version of that function anyway). In those cases `nuonce.stripped` will give a lot of speedup without sacrificing anything.

In cases when `called` or `value` propety is needed, you can use custom callback to set them up. For example:

```js
function target () {
  return 'I am here!';
}

// Using "once" module
const once = require('once');

var f = once(target);

f();
if (f.called) {
  // do something with f.value
}

// Using "nuonce" module
const nuonce = require('nuonce').copied;

var f = nuonce(target, function onTargetCalled (r) {
  f.value = r;
  f.called = true;
});
f.called = false;
f.value = undefined;

f();
if (f.called) {
  // do something with f.value
}
```

With additional wrapper to set the `called` property, `nuonce.copied` still seems to be on par with `once`, although there is a slight difference in favor of `once` and code is a bit less convenient to write. If you really need to use the `called` property often, it probably will be better to stick with the `once` module.

For browser use, it may be easier to use the [`once.js`](https://github.com/daniellmb/once.js) module, although only in cases where `nuonce.stripped` could be used (both are implemented almost exactly the same, but `once.js` seems to outerform everything).


## Benchmarks

Some benchmarks results for comparison (you can re-run them locally with: `npm run benchmarks`, after running `npm install --no-shrinkwrap`):

```markdown
Running inside Docker with Node v11.10.0 with Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v3.0.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v1.1.1 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 5,522,563 ops/sec ±4.85% (85 runs sampled)
  nuonce.stripped        x 5,023,268 ops/sec ±1.11% (87 runs sampled)
  once                   x 2,661,604 ops/sec ±0.82% (86 runs sampled)
  nuonce.copied          x 2,578,404 ops/sec ±2.03% (85 runs sampled)
  nuonce.copied + called x 1,955,444 ops/sec ±0.92% (86 runs sampled)
  nuonce.proxied         x 1,872,920 ops/sec ±0.85% (85 runs sampled)
  onetime                x    16,265 ops/sec ±1.96% (83 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 287,842 ops/sec ±4.59% (82 runs sampled)
  nuonce.stripped        x 246,090 ops/sec ±0.55% (91 runs sampled)
  nuonce.copied          x 226,070 ops/sec ±2.87% (88 runs sampled)
  nuonce.copied + called x 225,371 ops/sec ±0.89% (84 runs sampled)
  once                   x 217,899 ops/sec ±0.73% (89 runs sampled)
  nuonce.proxied         x  71,386 ops/sec ±0.74% (88 runs sampled)
  onetime                x  14,412 ops/sec ±1.87% (78 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 5,674,138 ops/sec ±4.13% (83 runs sampled)
  nuonce.stripped        x 5,074,941 ops/sec ±2.63% (86 runs sampled)
  nuonce.proxied         x 1,900,141 ops/sec ±0.57% (86 runs sampled)
  once                   x 1,549,319 ops/sec ±0.73% (86 runs sampled)
  nuonce.copied          x 1,474,493 ops/sec ±0.77% (85 runs sampled)
  nuonce.copied + called x 1,167,712 ops/sec ±2.15% (85 runs sampled)
  onetime                x    14,209 ops/sec ±1.75% (84 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 282,813 ops/sec ±4.32% (85 runs sampled)
  nuonce.stripped        x 234,765 ops/sec ±0.76% (89 runs sampled)
  nuonce.copied          x 214,084 ops/sec ±1.13% (88 runs sampled)
  nuonce.copied + called x 209,667 ops/sec ±2.10% (89 runs sampled)
  once                   x 202,084 ops/sec ±2.80% (88 runs sampled)
  nuonce.proxied         x  72,130 ops/sec ±0.60% (86 runs sampled)
  onetime                x  13,041 ops/sec ±1.84% (84 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default numbers for arguments, properties and number of calls:

```sh
ARGS=0 PROPS=0 CALLS=30 npm run benchmark
```
