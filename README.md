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

Even with additional wrapper to set the `called` property, `nuonce.copied` still seems to be faster than `once`, although the difference is almost negligible and code is a bit less convenient to write. If you really need to use the `called` property often, it probably will be better to stick with the `once` module.
For browser use, it may be easier to use the [`once.js`](https://github.com/daniellmb/once.js) module, although only in cases where `nuonce.stripped` could be used (both are implemented almost exactly the same).


## Benchmarks

Some benchmarks results for comparison (you can re-run them locally with: `npm run benchmarks`, after running `npm install --no-shrinkwrap`):

```markdown
Running on node v7.10.0 with Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v2.0.1 https://github.com/sindresorhus/onetime#readme  
- nuonce  v1.0.6 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  nuonce.stripped        x 2,540,267 ops/sec ±1.09% (88 runs sampled)
  once.js                x 2,498,980 ops/sec ±2.96% (79 runs sampled)
  nuonce.copied          x 1,044,929 ops/sec ±1.30% (89 runs sampled)
  nuonce.proxied         x   892,846 ops/sec ±0.90% (91 runs sampled)
  once                   x   822,335 ops/sec ±0.44% (91 runs sampled)
  nuonce.copied + called x   797,852 ops/sec ±0.40% (91 runs sampled)
  onetime                x    45,304 ops/sec ±3.06% (85 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 68,011 ops/sec ±0.52% (87 runs sampled)
  nuonce.stripped        x 64,745 ops/sec ±0.55% (92 runs sampled)
  nuonce.copied          x 63,072 ops/sec ±0.67% (93 runs sampled)
  once                   x 61,515 ops/sec ±0.40% (93 runs sampled)
  nuonce.copied + called x 61,105 ops/sec ±1.77% (91 runs sampled)
  nuonce.proxied         x 28,132 ops/sec ±0.75% (93 runs sampled)
  onetime                x 27,079 ops/sec ±1.15% (85 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 2,521,250 ops/sec ±3.00% (82 runs sampled)
  nuonce.stripped        x 2,476,128 ops/sec ±2.41% (87 runs sampled)
  nuonce.proxied         x   851,430 ops/sec ±0.94% (89 runs sampled)
  nuonce.copied          x   813,921 ops/sec ±0.84% (90 runs sampled)
  nuonce.copied + called x   673,932 ops/sec ±1.95% (85 runs sampled)
  once                   x   668,358 ops/sec ±0.51% (90 runs sampled)
  onetime                x    36,544 ops/sec ±2.31% (87 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 94,912 ops/sec ±0.46% (84 runs sampled)
  nuonce.stripped        x 89,186 ops/sec ±0.60% (93 runs sampled)
  nuonce.copied          x 83,896 ops/sec ±2.32% (90 runs sampled)
  nuonce.copied + called x 83,752 ops/sec ±0.57% (92 runs sampled)
  once                   x 81,788 ops/sec ±0.47% (89 runs sampled)
  nuonce.proxied         x 32,846 ops/sec ±0.71% (92 runs sampled)
  onetime                x 26,204 ops/sec ±1.21% (87 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default numbers for arguments, properties and number of calls:

```sh
ARGS=0 PROPS=0 CALLS=30 npm run benchmark
```
