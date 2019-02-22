nuonce
======

Yet another implementation of `once` - a function wrapper that will call a target function just once. Every other call after the first one will return result from the first call.

It provides just a few methods. Each one results in a function better resembling a target than the previous one, for an additional cost in speed.

`nuonce.stripped` is for use when target functions do not have any custom properties, or when those properties are not needed to be accessible on the returned function. It is A LOT faster than any of the other methods and seems to be a good replacement for popular [`once`](https://github.com/isaacs/once) module in most use cases.

`nuonce.copied` gives comparable result to the one returned by `once` module, only slightly faster and with the same `length` as target function, but without custom `called` and `value` properties.

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

Usually, `once` is called on a function that does not have any custom properties (or they are not accessed through "onced" version of that function anyway), e.g., "`cb`" or "`callback`" functions. In those cases `nuonce.stripped` will give a lot of speedup without sacrificing anything.

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

With additional wrapper to set the `called` property, `nuonce.copied` still seems to be on par with `once`, although there is a small difference in favor of `once` and code is a bit less convenient to write. If you really need to use the `called` property often, it probably will be better to stick with the `once` module.

For browser use, it may be easier to use the [`once.js`](https://github.com/daniellmb/once.js) module, although only in cases where `nuonce.stripped` could be used (both are implemented almost exactly the same, but `once.js` seems to outerform everything).


## Benchmarks

Some benchmarks results for comparison (you can re-run them locally with: `npm run benchmarks`, after running `npm install --no-shrinkwrap`):

```markdown
Running inside Docker with Alpine Linux 3.9, Node v11.10.0 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v3.0.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v1.1.1 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 9,041,006 ops/sec ±4.20% (90 runs sampled)
  nuonce.stripped        x 7,842,874 ops/sec ±1.69% (86 runs sampled)
  nuonce.copied          x 4,419,690 ops/sec ±2.84% (83 runs sampled)
  once                   x 4,362,401 ops/sec ±2.82% (89 runs sampled)
  nuonce.copied + called x 3,512,090 ops/sec ±0.93% (90 runs sampled)
  nuonce.proxied         x 3,166,435 ops/sec ±1.05% (87 runs sampled)
  onetime                x    27,447 ops/sec ±2.54% (85 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 437,852 ops/sec ±3.83% (92 runs sampled)
  nuonce.stripped        x 394,273 ops/sec ±1.13% (92 runs sampled)
  nuonce.copied          x 337,436 ops/sec ±3.16% (86 runs sampled)
  once                   x 335,440 ops/sec ±1.18% (88 runs sampled)
  nuonce.copied + called x 333,349 ops/sec ±1.55% (90 runs sampled)
  nuonce.proxied         x 114,571 ops/sec ±0.86% (94 runs sampled)
  onetime                x  23,419 ops/sec ±1.84% (85 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 9,314,544 ops/sec ±3.97% (88 runs sampled)
  nuonce.stripped        x 7,659,787 ops/sec ±2.13% (83 runs sampled)
  nuonce.proxied         x 3,120,671 ops/sec ±2.04% (91 runs sampled)
  once                   x 2,608,510 ops/sec ±1.34% (90 runs sampled)
  nuonce.copied          x 2,575,699 ops/sec ±1.83% (88 runs sampled)
  nuonce.copied + called x 2,163,408 ops/sec ±0.98% (90 runs sampled)
  onetime                x    23,666 ops/sec ±2.49% (83 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 434,546 ops/sec ±3.86% (93 runs sampled)
  nuonce.stripped        x 388,903 ops/sec ±1.34% (92 runs sampled)
  nuonce.copied          x 324,146 ops/sec ±1.69% (89 runs sampled)
  nuonce.copied + called x 322,224 ops/sec ±2.70% (91 runs sampled)
  once                   x 312,030 ops/sec ±2.43% (90 runs sampled)
  nuonce.proxied         x 113,996 ops/sec ±0.72% (94 runs sampled)
  onetime                x  22,038 ops/sec ±1.45% (86 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default numbers for arguments, properties and number of calls:

```sh
ARGS=0 PROPS=0 CALLS=30 npm run benchmark
```
