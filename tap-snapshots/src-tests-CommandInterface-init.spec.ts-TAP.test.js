/* IMPORTANT
 * This snapshot file is auto-generated, but designed for humans.
 * It should be checked into source control and tracked carefully.
 * Re-generate by setting TAP_SNAPSHOT=1 and running tests.
 * Make sure to inspect the output below.  Do not ignore changes!
 */
'use strict'
exports[`src/tests/CommandInterface/init.spec.ts TAP initial command returned not ok > must match snapshot 1`] = `
Object {
  "errorMessage": "Drone is not ready to recieve commands. Command 'command' returned 'error'",
  "message": "error",
  "status": "error",
}
`

exports[`src/tests/CommandInterface/init.spec.ts TAP initial command throws error > must match snapshot 1`] = `
Object {
  "errorMessage": "Drone is not ready to recieve commands. Command 'command' failed cause of exception: OOPS",
  "exception": Error: OOPS,
  "message": null,
  "status": "error",
}
`

exports[`src/tests/CommandInterface/init.spec.ts TAP initial command timeouted > must match snapshot 1`] = `
Object {
  "errorMessage": "Drone is not ready to recieve commands. Command 'command' failed cause of exception: timeout after 1000 ms",
  "exception": Error: timeout after 1000 ms,
  "message": null,
  "status": "error",
}
`
