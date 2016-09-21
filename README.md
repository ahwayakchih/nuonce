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

Some benchmarks for comparison (you can re-run them locally with: `npm run benchmarks`, after running `npm install --no-shrinkwrap`):

```markdown
Running on node v6.6.0 with Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.3.3 https://github.com/isaacs/once#readme    
- once.js v0.0.4 https://github.com/daniellmb/once.js     
- onetime v1.1.0 https://github.com/sindresorhus/onetime  
- nuonce  v1.0.5 https://github.com/ahwayakchih/nuonce    

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  nuonce.stripped        x 6,148,090 ops/sec ±0.33% (94 runs sampled)
  once.js                x 6,069,198 ops/sec ±0.49% (92 runs sampled)
  onetime                x 4,826,907 ops/sec ±0.71% (88 runs sampled)
  nuonce.copied          x 3,044,625 ops/sec ±0.49% (90 runs sampled)
  nuonce.proxied         x 2,669,478 ops/sec ±0.79% (90 runs sampled)
  nuonce.copied + called x 2,600,309 ops/sec ±0.84% (91 runs sampled)
  once                   x 1,643,120 ops/sec ±0.62% (90 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 3,565,112 ops/sec ±0.51% (92 runs sampled)
  nuonce.stripped        x 3,542,762 ops/sec ±0.34% (94 runs sampled)
  onetime                x 3,101,511 ops/sec ±0.74% (89 runs sampled)
  nuonce.copied          x 2,639,484 ops/sec ±1.02% (89 runs sampled)
  nuonce.copied + called x 2,402,827 ops/sec ±0.86% (93 runs sampled)
  once                   x 1,332,807 ops/sec ±0.56% (88 runs sampled)
  nuonce.proxied         x   233,481 ops/sec ±0.45% (94 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  nuonce.stripped        x 6,399,270 ops/sec ±0.48% (90 runs sampled)
  once.js                x 6,371,465 ops/sec ±0.57% (89 runs sampled)
  onetime                x 4,888,700 ops/sec ±0.87% (88 runs sampled)
  nuonce.proxied         x 3,591,526 ops/sec ±1.16% (92 runs sampled)
  nuonce.copied + called x 3,049,244 ops/sec ±1.44% (88 runs sampled)
  nuonce.copied          x 2,441,948 ops/sec ±0.87% (89 runs sampled)
  once                   x 1,052,507 ops/sec ±0.41% (91 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 3,661,340 ops/sec ±0.61% (84 runs sampled)
  nuonce.stripped        x 3,638,735 ops/sec ±0.44% (91 runs sampled)
  onetime                x 3,150,154 ops/sec ±0.66% (90 runs sampled)
  nuonce.copied + called x 2,400,797 ops/sec ±0.92% (90 runs sampled)
  nuonce.copied          x 1,808,186 ops/sec ±0.81% (86 runs sampled)
  once                   x   775,680 ops/sec ±0.53% (86 runs sampled)
  nuonce.proxied         x   229,210 ops/sec ±0.53% (94 runs sampled)
```
