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
Running inside Docker (Alpine Linux v3.9) with Node v11.10.0 and Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v3.0.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v1.1.2 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 9,189,156 ops/sec ±4.94% (87 runs sampled)
  nuonce.stripped        x 8,270,327 ops/sec ±1.56% (89 runs sampled)
  nuonce.copied          x 4,540,303 ops/sec ±2.53% (89 runs sampled)
  once                   x 4,414,711 ops/sec ±2.88% (90 runs sampled)
  nuonce.copied + called x 3,451,397 ops/sec ±1.04% (90 runs sampled)
  nuonce.proxied         x 3,173,667 ops/sec ±1.62% (91 runs sampled)
  onetime                x    26,852 ops/sec ±2.52% (85 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 436,996 ops/sec ±4.08% (92 runs sampled)
  nuonce.stripped        x 384,648 ops/sec ±3.00% (89 runs sampled)
  nuonce.copied + called x 348,604 ops/sec ±0.94% (90 runs sampled)
  nuonce.copied          x 342,922 ops/sec ±1.57% (87 runs sampled)
  once                   x 331,233 ops/sec ±1.18% (93 runs sampled)
  nuonce.proxied         x 112,857 ops/sec ±1.84% (86 runs sampled)
  onetime                x  24,625 ops/sec ±1.79% (86 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 9,363,528 ops/sec ±3.83% (92 runs sampled)
  nuonce.stripped        x 7,881,771 ops/sec ±2.98% (88 runs sampled)
  nuonce.proxied         x 3,093,339 ops/sec ±2.25% (87 runs sampled)
  once                   x 2,634,843 ops/sec ±1.02% (91 runs sampled)
  nuonce.copied          x 2,533,145 ops/sec ±1.20% (86 runs sampled)
  nuonce.copied + called x 2,079,168 ops/sec ±0.95% (89 runs sampled)
  onetime                x    23,444 ops/sec ±2.64% (84 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 429,331 ops/sec ±3.84% (92 runs sampled)
  nuonce.stripped        x 390,563 ops/sec ±0.99% (92 runs sampled)
  nuonce.copied          x 319,141 ops/sec ±3.19% (88 runs sampled)
  nuonce.copied + called x 317,501 ops/sec ±1.64% (90 runs sampled)
  once                   x 315,299 ops/sec ±2.93% (91 runs sampled)
  nuonce.proxied         x 116,185 ops/sec ±0.63% (92 runs sampled)
  onetime                x  21,704 ops/sec ±1.67% (85 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default numbers for arguments, properties and number of calls:

```sh
ARGS=0 PROPS=0 CALLS=30 npm run benchmark
```
