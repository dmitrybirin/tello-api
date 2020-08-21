/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`src/tests/ci-execution.spec.ts TAP test action command returns error > must match snapshot 1`] = `
Command 'test' failed cause of exception: Command 'test' returned 'error'
`

exports[`src/tests/ci-execution.spec.ts TAP test action command returns not ok/error > must match snapshot 1`] = `
Command 'test' failed cause of exception: Command 'test' returned 'not expected'. Should be only ok/error
`

exports[`src/tests/ci-execution.spec.ts TAP test action command throws error > must match snapshot 1`] = `
Command 'test' failed cause of exception: OOPS
`

exports[`src/tests/ci-execution.spec.ts TAP test action command timeouted > must match snapshot 1`] = `
Command 'test' failed cause of exception: timeout after 1000 ms
`

exports[`src/tests/ci-execution.spec.ts TAP test one before another ends should fail > must match snapshot 1`] = `
Command test2 will not be executed, test1 still in progress
`

exports[`src/tests/ci-execution.spec.ts TAP try to run command after emmiting error to socket > must match snapshot 1`] = `
Interface is in failed status, please reinit
`

exports[`src/tests/ci-execution.spec.ts TAP try to run command after interface failed by timeout > must match snapshot 1`] = `
Drone is not ready to recieve commands: Command 'command' failed cause of exception: timeout after 1000 ms
`

exports[`src/tests/ci-execution.spec.ts TAP try to run command without init > must match snapshot 1`] = `
Interface is in the initial status, please init to send commands
`
