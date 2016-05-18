nuonce
======

Yet another implementation of `once` - a function wrapper that makes sure, that target function will be called only once.
Every call after the first one will return results from the first call.

It provides a few methods, each making returned function look a bit closer to target function for a cost of speed.

`nuonce.stripped` is for use when target functions do not have any custom properties, or when those properties are not needed to be accessible on the result function. It is A LOT faster than any other method and seems to be a good replacement for popular [`once`](https://github.com/isaacs/once) module in most of common use cases.

`nuonce.copied` gives comparable result to the one returned from `once` module, only faster and with the same `length` as target function, but without setting custom `called` and `value` properties on the returned function.

`nuonce.proxied` is available only when Proxy API (either [ES6](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy) or [older, deprecated](https://developer.mozilla.org/en-US/docs/Archive/Web/Old_Proxy_API)) is available, but it returns callable object that allows to access any custom properties or methods of target function, including those added in future (after "nuonced" version was prepared).

Nuonce is targetted for use in node.js application. Although it may work in web browsers (at least `nuonce.stripped` should work), it is tested and optimized on node.js (with V8 engine).


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

// When properties should always be updated:
var f = nuonce.proxied(target);
target.foo = 242;
f.length;    // 3
f.foo;       // 242
f(1, 2, 3);  // called with: 1, 2, 3
f() === f(); // true
```


## Compatibility

Nuonce is compatible with `once` module for most use cases found in other projects, i.e., none of `called` or `value` properties set on "onced" function are used.

In most use cases checked, `once` is called on a function that does not have any custom properties (or they are not used on "onced" version). In those cases `nuonce.stripped` would give a lot of speedup without sacrificing anything.

In cases when check if function was `called` is needed, you can add custom wrapper for that. For example:

```js
function target () {
  return 'I am here!';
}

// Using "once" module
const once = require('once');

var f = once(target);
if (f.called) {
  // do something with f.value
}

// Using "nuonce" module
const nuonce = require('nuonce').copied;

var f = nuonce.copied(function () {
  f.value = target.apply(this, arguments);
  f.called = true;
});
f.called = false;

if (f.called) {
  // do something with f.value
}
```

Even with additional wrapper to set `called`, `nuonce.copied` still seems to be faster than `once`, although the difference is almost negligible and code is a bit less convenient to write. If you really need to use `called` often, it probably will be better to stick with `once` module.
For browser use, it may be easier to use [`once.js`](https://github.com/daniellmb/once.js) module, although only in cases where `nuonce.stripped` could be used (they are implemented almost exactly the same).


## Benchmarks

Some benchmarks for comparison (you can re-run them locally with: `npm run benchmarks`):

```markdown
Running on node v6.2.0 with Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.3.3 https://github.com/isaacs/once         
- once.js v0.0.4 https://github.com/daniellmb/once.js   
- nuonce  v1.0.3 https://github.com/ahwayakchih/nuonce  

Test function with 0 properties, called 1 time with 1 argument

  6 tests completed.

  nuonce.stripped        x 5,583,774 ops/sec ±0.69% (91 runs sampled)
  once.js                x 5,547,111 ops/sec ±0.58% (89 runs sampled)
  nuonce.copied          x 3,447,869 ops/sec ±1.00% (85 runs sampled)
  nuonce.proxied         x 3,280,237 ops/sec ±1.11% (85 runs sampled)
  nuonce.copied + called x 2,571,866 ops/sec ±0.71% (87 runs sampled)
  once                   x 1,758,441 ops/sec ±0.69% (91 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  6 tests completed.

  nuonce.stripped        x 3,296,597 ops/sec ±0.69% (85 runs sampled)
  once.js                x 3,245,085 ops/sec ±2.41% (89 runs sampled)
  nuonce.copied          x 2,411,252 ops/sec ±0.58% (90 runs sampled)
  nuonce.copied + called x 2,188,173 ops/sec ±0.62% (89 runs sampled)
  once                   x 1,428,284 ops/sec ±0.60% (88 runs sampled)
  nuonce.proxied         x   186,617 ops/sec ±0.45% (93 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  6 tests completed.

  once.js                x 5,638,404 ops/sec ±1.01% (89 runs sampled)
  nuonce.stripped        x 5,601,905 ops/sec ±1.62% (88 runs sampled)
  nuonce.proxied         x 3,377,359 ops/sec ±1.09% (86 runs sampled)
  nuonce.copied + called x 2,953,861 ops/sec ±1.11% (84 runs sampled)
  nuonce.copied          x 2,345,945 ops/sec ±0.73% (90 runs sampled)
  once                   x 1,079,779 ops/sec ±0.72% (85 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  6 tests completed.

  nuonce.stripped        x 3,415,089 ops/sec ±0.63% (87 runs sampled)
  once.js                x 3,390,182 ops/sec ±0.53% (91 runs sampled)
  nuonce.copied + called x 2,009,153 ops/sec ±0.48% (88 runs sampled)
  nuonce.copied          x 1,821,141 ops/sec ±0.59% (87 runs sampled)
  once                   x   978,850 ops/sec ±0.69% (88 runs sampled)
  nuonce.proxied         x   187,778 ops/sec ±0.49% (90 runs sampled)

```
