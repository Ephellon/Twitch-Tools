/*** /dsl/host/extension-adapter.test.mjs
 * Runs the host conformance suite against the extension's adapter (src/lib/dsl-host.js).
 */

import { createRequire } from 'node:module';
import { createAdapter } from '../../lib/dsl-host.js';

const require = createRequire(import.meta.url);
const { runConformance } = require('./host-conformance.test.js');

const { passed, failed } = await runConformance(createAdapter);

console.log(`\n  extension adapter: ${ passed } passed, ${ failed } failed`);
process.exitCode = failed ? 1 : 0;
