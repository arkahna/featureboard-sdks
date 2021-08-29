# @featureboard/js-sdk

## 0.3.0

### Minor Changes

- [`af7baef`](https://github.com/featureboard/sdks/commit/af7baef7e5b28d0906140617339e645d104b2195) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - SDK will automatically retry when it fails to start

  Live will fall back to fetching the initial values via HTTP then continue reconnecting in the background, HTTP will retry with backoff up to 4 times

## 0.2.0

### Minor Changes

- [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Added use of last-modfied into client header so server can return 304 if nothing has changed

* [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Ensure only one request for features can be in flight at the same time

### Patch Changes

- [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed wrong http method being used in the http client

* [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Update readme to point at documentation site

## 0.1.0

### Minor Changes

- [`ddee7b3`](https://github.com/featureboard/sdks/commit/ddee7b3dec288ee1f8920a750de29706f79a512f) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies and fixed IWebSocket.send argument type

## 0.0.3

### Patch Changes

- [`f04ab26`](https://github.com/featureboard/sdks/commit/f04ab26936a742d493c693d83729ef264837f6c3) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Marked sdks as sideEffect free

## 0.0.2

### Patch Changes

- [`e268a7b`](https://github.com/featureboard/sdks/commit/e268a7b45125808e42e81bcf849091e7b919d448) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed pacakge step
