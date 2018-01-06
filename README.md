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
Running on node v8.9.4 with Intel(R) Core(TM) i7-3537U CPU @ 2.00GHz x 4

Testing:
- once    v1.4.0 https://github.com/isaacs/once#readme           
- once.js v0.0.4 https://github.com/daniellmb/once.js            
- onetime v2.0.1 https://github.com/sindresorhus/onetime#readme  
- nuonce  v1.1.0 https://github.com/ahwayakchih/nuonce           

Test function with 0 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 5,962,076 ops/sec ±1.89% (91 runs sampled)
  nuonce.stripped        x 5,343,275 ops/sec ±0.30% (91 runs sampled)
  nuonce.copied          x 4,070,738 ops/sec ±0.62% (88 runs sampled)
  once                   x 3,382,194 ops/sec ±0.66% (90 runs sampled)
  nuonce.copied + called x 2,993,967 ops/sec ±0.15% (95 runs sampled)
  nuonce.proxied         x 2,779,245 ops/sec ±0.63% (95 runs sampled)
  onetime                x    44,113 ops/sec ±1.57% (86 runs sampled)

Test function with 0 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 442,624 ops/sec ±0.80% (92 runs sampled)
  nuonce.stripped        x 363,304 ops/sec ±0.55% (94 runs sampled)
  once                   x 324,006 ops/sec ±0.24% (95 runs sampled)
  nuonce.copied          x 321,841 ops/sec ±0.51% (95 runs sampled)
  nuonce.copied + called x 314,508 ops/sec ±0.63% (94 runs sampled)
  nuonce.proxied         x 110,878 ops/sec ±0.31% (93 runs sampled)
  onetime                x  38,049 ops/sec ±1.43% (88 runs sampled)

Test function with 3 properties, called 1 time with 1 argument

  7 tests completed.

  once.js                x 6,046,749 ops/sec ±0.87% (88 runs sampled)
  nuonce.stripped        x 5,254,729 ops/sec ±0.33% (91 runs sampled)
  nuonce.proxied         x 2,767,308 ops/sec ±0.71% (94 runs sampled)
  nuonce.copied          x 2,655,043 ops/sec ±2.76% (93 runs sampled)
  nuonce.copied + called x 2,130,970 ops/sec ±0.44% (87 runs sampled)
  once                   x 1,730,065 ops/sec ±2.31% (91 runs sampled)
  onetime                x    36,052 ops/sec ±2.28% (85 runs sampled)

Test function with 3 properties, called 50 times with 1 argument

  7 tests completed.

  once.js                x 453,070 ops/sec ±2.62% (90 runs sampled)
  nuonce.stripped        x 369,021 ops/sec ±0.18% (94 runs sampled)
  nuonce.copied          x 310,181 ops/sec ±0.75% (94 runs sampled)
  nuonce.copied + called x 303,405 ops/sec ±0.22% (95 runs sampled)
  once                   x 293,023 ops/sec ±0.46% (93 runs sampled)
  nuonce.proxied         x 110,827 ops/sec ±0.51% (91 runs sampled)
  onetime                x  32,897 ops/sec ±1.51% (89 runs sampled)
```

You can also start a single benchmark run by calling:

```sh
npm run benchmark
```

For a single benchmark run, you can optionally override default numbers for arguments, properties and number of calls:

```sh
ARGS=0 PROPS=0 CALLS=30 npm run benchmark
```
