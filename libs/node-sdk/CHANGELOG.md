# @featureboard/node-sdk

## 0.5.0

### Minor Changes

- [`af7baef`](https://github.com/featureboard/sdks/commit/af7baef7e5b28d0906140617339e645d104b2195) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - SDK will automatically retry when it fails to start

  Live will fall back to fetching the initial values via HTTP then continue reconnecting in the background, HTTP will retry with backoff up to 4 times

### Patch Changes

- Updated dependencies [[`af7baef`](https://github.com/featureboard/sdks/commit/af7baef7e5b28d0906140617339e645d104b2195)]:
  - @featureboard/js-sdk@0.3.0

## 0.4.0

### Minor Changes

- [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Switch default strategy in node sdk to be polling

### Patch Changes

- Updated dependencies [[`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35)]:
  - @featureboard/js-sdk@0.2.0

## 0.3.0

### Minor Changes

- [`3e8d085`](https://github.com/featureboard/sdks/commit/3e8d085f07b09f4dd595f3351343d8e02c3c1179) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Allow a custom feature store to be specified, this allows users to persist/hydrate their initial features outside the SDK

* [`d7befc2`](https://github.com/featureboard/sdks/commit/d7befc28c06bdfc8c30f5a4df29f526a9891904d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Implemented basic caching using Last-Modified headers in the SDK as most node fetch implementations do not support http caching, and the ones that do require additional configuration

- [`d7befc2`](https://github.com/featureboard/sdks/commit/d7befc28c06bdfc8c30f5a4df29f526a9891904d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Add maxAgeMs option to on-request update strategy to cache responses in the SDK for 30 seconds by default

## 0.2.0

### Minor Changes

- [`ddee7b3`](https://github.com/featureboard/sdks/commit/ddee7b3dec288ee1f8920a750de29706f79a512f) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies and fixed IWebSocket.send argument type

### Patch Changes

- Updated dependencies [[`ddee7b3`](https://github.com/featureboard/sdks/commit/ddee7b3dec288ee1f8920a750de29706f79a512f)]:
  - @featureboard/js-sdk@0.1.0

## 0.1.0

### Minor Changes

- [#1](https://github.com/featureboard/sdks/pull/1) [`8dc891f`](https://github.com/featureboard/sdks/commit/8dc891faeb173e24471a4322f964cceb96df0dda) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Renamed audienceValues to audienceExceptions in server SDK

## 0.0.5

### Patch Changes

- [`ab7b7bb`](https://github.com/featureboard/sdks/commit/ab7b7bbad7e11e0fa6d59c6b2279cdf6d1b24f9d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Further fix for hang

## 0.0.4

### Patch Changes

- [`9d3ab09`](https://github.com/featureboard/sdks/commit/9d3ab09cfc9345c084601632781d32992b0ca29c) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed awaiting .request() on server SDK when not using on-request mode hanging

## 0.0.3

### Patch Changes

- [`f04ab26`](https://github.com/featureboard/sdks/commit/f04ab26936a742d493c693d83729ef264837f6c3) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Marked sdks as sideEffect free

- Updated dependencies [[`f04ab26`](https://github.com/featureboard/sdks/commit/f04ab26936a742d493c693d83729ef264837f6c3)]:
  - @featureboard/js-sdk@0.0.3

## 0.0.2

### Patch Changes

- [`e268a7b`](https://github.com/featureboard/sdks/commit/e268a7b45125808e42e81bcf849091e7b919d448) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed pacakge step

- Updated dependencies [[`e268a7b`](https://github.com/featureboard/sdks/commit/e268a7b45125808e42e81bcf849091e7b919d448)]:
  - @featureboard/js-sdk@0.0.2
