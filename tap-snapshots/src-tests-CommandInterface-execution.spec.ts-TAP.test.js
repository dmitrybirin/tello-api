/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`src/tests/CommandInterface/execution.spec.ts TAP test action command returns error > must match snapshot 1`] = `
Object {
  "errorMessage": "Command 'test' returned 'error'",
  "message": "error",
  "status": "error",
}
`

exports[`src/tests/CommandInterface/execution.spec.ts TAP test action command returns not ok/error > must match snapshot 1`] = `
Object {
  "errorMessage": "Command 'test' returned 'not expected'. Should be only ok/error",
  "message": "not expected",
  "status": "error",
}
`

exports[`src/tests/CommandInterface/execution.spec.ts TAP test action command throws error > must match snapshot 1`] = `
Object {
  "errorMessage": "Command 'test' failed cause of exception: OOPS",
  "exception": Error: OOPS,
  "message": null,
  "status": "error",
}
`

exports[`src/tests/CommandInterface/execution.spec.ts TAP test action command timeouted > must match snapshot 1`] = `
Object {
  "errorMessage": "Command 'test' failed cause of exception: timeout after 1000 ms",
  "exception": Error: timeout after 1000 ms,
  "message": null,
  "status": "error",
}
`

exports[`src/tests/CommandInterface/execution.spec.ts TAP test one before another ends should fail > must match snapshot 1`] = `
Object {
  "errorMessage": "Command test2 will not be executed, test1 still in progress",
  "message": null,
  "status": "error",
}
`
