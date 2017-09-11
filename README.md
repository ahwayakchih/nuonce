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
Running on node v8.4.0 with Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v2.0.1 https://github.com/sindresorhus/onetime#readme  
- nuonce  v1.1.0 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 4,297,302 ops/sec ±0.66% (89 runs sampled)
  nuonce.stripped        x 3,794,377 ops/sec ±0.63% (92 runs sampled)
  nuonce.copied          x 3,023,588 ops/sec ±0.35% (92 runs sampled)
  once                   x 2,347,040 ops/sec ±0.34% (90 runs sampled)
  nuonce.copied + called x 2,324,618 ops/sec ±0.85% (87 runs sampled)
  nuonce.proxied         x 1,155,970 ops/sec ±0.29% (92 runs sampled)
  onetime                x    42,803 ops/sec ±1.47% (88 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 186,972 ops/sec ±0.41% (94 runs sampled)
  nuonce.stripped        x 162,260 ops/sec ±0.33% (94 runs sampled)
  once                   x 153,629 ops/sec ±0.31% (94 runs sampled)
  nuonce.copied          x 143,330 ops/sec ±0.66% (93 runs sampled)
  nuonce.copied + called x 142,007 ops/sec ±0.30% (94 runs sampled)
  nuonce.proxied         x  47,978 ops/sec ±0.74% (94 runs sampled)
  onetime                x  33,232 ops/sec ±1.25% (89 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 4,294,446 ops/sec ±0.79% (88 runs sampled)
  nuonce.stripped        x 3,809,497 ops/sec ±0.37% (93 runs sampled)
  nuonce.copied          x 2,149,583 ops/sec ±0.60% (94 runs sampled)
  nuonce.copied + called x 1,762,630 ops/sec ±0.29% (89 runs sampled)
  once                   x 1,534,433 ops/sec ±0.44% (87 runs sampled)
  nuonce.proxied         x 1,191,697 ops/sec ±0.96% (91 runs sampled)
  onetime                x    35,111 ops/sec ±2.68% (86 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 185,365 ops/sec ±0.55% (91 runs sampled)
  nuonce.stripped        x 162,969 ops/sec ±0.36% (90 runs sampled)
  once                   x 147,353 ops/sec ±0.39% (94 runs sampled)
  nuonce.copied          x 142,067 ops/sec ±0.78% (93 runs sampled)
  nuonce.copied + called x 139,606 ops/sec ±0.37% (92 runs sampled)
  nuonce.proxied         x  50,019 ops/sec ±0.63% (93 runs sampled)
  onetime                x  29,184 ops/sec ±1.15% (88 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default numbers for arguments, properties and number of calls:

```sh
ARGS=0 PROPS=0 CALLS=30 npm run benchmark
```
