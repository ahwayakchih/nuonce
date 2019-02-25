/* eslint strict: 0 */

'use strict';

/**
 * Nuonce exports three functions: `stripped`, `observable`, `copied` and `proxied` (also exported as `default`).
 *
 * @exports module:nuonce
 * @see {@link module:nuonce.stripped}, {@link module:nuonce.observable}, {@link module:nuonce.copied}, {@link module:nuonce.proxied}
 */
module.exports.stripped = require('./stripped.js');
module.exports.observable = require('./observable.js');
module.exports.copied = require('./copied.js');
module.exports.proxied = require('./proxied.js');
module.exports.default = module.exports.proxied;
