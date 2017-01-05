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
Running on node v7.3.0 with Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v2.0.0 https://github.com/sindresorhus/onetime#readme  
- nuonce  v1.0.5 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  nuonce.stripped        x 6,399,086 ops/sec ±0.44% (94 runs sampled)
  once.js                x 6,118,635 ops/sec ±0.56% (91 runs sampled)
  nuonce.copied          x 3,778,129 ops/sec ±0.54% (93 runs sampled)
  nuonce.proxied         x 3,675,191 ops/sec ±1.52% (88 runs sampled)
  nuonce.copied + called x 3,135,986 ops/sec ±0.81% (92 runs sampled)
  once                   x 1,719,585 ops/sec ±2.01% (85 runs sampled)
  onetime                x    53,131 ops/sec ±1.54% (86 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  nuonce.stripped        x 3,588,887 ops/sec ±1.16% (93 runs sampled)
  once.js                x 3,453,858 ops/sec ±3.52% (85 runs sampled)
  nuonce.copied          x 2,527,547 ops/sec ±0.64% (89 runs sampled)
  nuonce.copied + called x 1,870,464 ops/sec ±1.48% (92 runs sampled)
  once                   x 1,322,190 ops/sec ±3.60% (82 runs sampled)
  nuonce.proxied         x   243,054 ops/sec ±0.58% (89 runs sampled)
  onetime                x    51,090 ops/sec ±3.34% (85 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  nuonce.stripped        x 6,592,018 ops/sec ±0.53% (90 runs sampled)
  once.js                x 6,290,218 ops/sec ±2.15% (84 runs sampled)
  nuonce.proxied         x 3,825,800 ops/sec ±0.55% (92 runs sampled)
  nuonce.copied + called x 2,464,890 ops/sec ±2.35% (90 runs sampled)
  nuonce.copied          x 2,335,140 ops/sec ±0.74% (92 runs sampled)
  once                   x 1,023,533 ops/sec ±2.72% (86 runs sampled)
  onetime                x    44,100 ops/sec ±1.57% (85 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  nuonce.stripped        x 3,706,612 ops/sec ±1.14% (93 runs sampled)
  once.js                x 3,584,941 ops/sec ±2.81% (85 runs sampled)
  nuonce.copied + called x 2,188,669 ops/sec ±0.78% (88 runs sampled)
  nuonce.copied          x 1,828,739 ops/sec ±0.84% (87 runs sampled)
  once                   x   850,076 ops/sec ±0.40% (92 runs sampled)
  nuonce.proxied         x   247,224 ops/sec ±0.73% (91 runs sampled)
  onetime                x    43,863 ops/sec ±1.42% (86 runs sampled)
```
