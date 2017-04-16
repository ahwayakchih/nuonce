nuonce
======

Yet another implementation of `once` - a function wrapper that makes sure, that target function will be called only once.
Every call after the first one will return results from the first call.

It provides a few methods, each making returned function look a bit closer to target function for a cost of speed.

`nuonce.stripped` is for use when target functions do not have any custom properties, or when those properties are not needed to be accessible on the result function. It is A LOT faster than any of the other methods and seems to be a good replacement for popular [`once`](https://github.com/isaacs/once) module in most of common use cases.

`nuonce.copied` gives comparable result to the one returned from `once` module, only faster and with the same `length` as target function, but without setting custom `called` and `value` properties on the returned function.

`nuonce.proxied` returns callable object ([ES6 Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy)) that allows to access any custom properties or methods of target function, including those added in future (after "nuonced" version was prepared).

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

Some benchmarks results for comparison (you can re-run them locally with: `npm run benchmarks`, after running `npm install --no-shrinkwrap`):

```markdown
Running on node v7.9.0 with Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v2.0.1 https://github.com/sindresorhus/onetime#readme  
- nuonce  v1.0.6 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 3,136,384 ops/sec ±1.98% (87 runs sampled)
  nuonce.stripped        x 2,957,145 ops/sec ±3.11% (88 runs sampled)
  nuonce.copied          x 2,279,301 ops/sec ±0.79% (87 runs sampled)
  nuonce.copied + called x 1,481,383 ops/sec ±1.81% (86 runs sampled)
  once                   x 1,013,923 ops/sec ±3.02% (87 runs sampled)
  nuonce.proxied         x   944,697 ops/sec ±2.50% (88 runs sampled)
  onetime                x    47,879 ops/sec ±1.59% (84 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 600,871 ops/sec ±2.95% (87 runs sampled)
  once                   x 445,950 ops/sec ±0.63% (88 runs sampled)
  nuonce.stripped        x 441,575 ops/sec ±1.33% (89 runs sampled)
  nuonce.copied          x 416,236 ops/sec ±2.11% (89 runs sampled)
  nuonce.copied + called x 331,503 ops/sec ±2.24% (89 runs sampled)
  nuonce.proxied         x  60,938 ops/sec ±0.84% (91 runs sampled)
  onetime                x  44,233 ops/sec ±1.49% (82 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 3,409,355 ops/sec ±3.27% (81 runs sampled)
  nuonce.stripped        x 3,359,939 ops/sec ±2.25% (88 runs sampled)
  nuonce.copied          x 1,497,912 ops/sec ±1.32% (89 runs sampled)
  nuonce.copied + called x 1,436,774 ops/sec ±0.73% (90 runs sampled)
  once                   x   814,258 ops/sec ±2.12% (89 runs sampled)
  nuonce.proxied         x   756,336 ops/sec ±0.88% (82 runs sampled)
  onetime                x    40,041 ops/sec ±1.49% (86 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 632,389 ops/sec ±0.56% (92 runs sampled)
  nuonce.stripped        x 467,765 ops/sec ±0.76% (89 runs sampled)
  nuonce.copied          x 397,137 ops/sec ±0.53% (91 runs sampled)
  once                   x 352,432 ops/sec ±1.08% (88 runs sampled)
  nuonce.copied + called x 267,691 ops/sec ±2.21% (91 runs sampled)
  nuonce.proxied         x  53,476 ops/sec ±0.77% (90 runs sampled)
  onetime                x  36,624 ops/sec ±1.49% (86 runs sampled)
```

You can also run a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default numbers for arguments, properties and number of calls:

```sh
ARGS=0 PROPS=0 CALLS=30 npm run benchmark
```
