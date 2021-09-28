# @featureboard/react-sdk

## 0.4.2

### Patch Changes

- Updated dependencies [[`e7f2df6`](https://github.com/featureboard/sdks/commit/e7f2df6af6d0b8bd2033c870f0c70bfe8f5fb113), [`e7f2df6`](https://github.com/featureboard/sdks/commit/e7f2df6af6d0b8bd2033c870f0c70bfe8f5fb113)]:
  - @featureboard/js-sdk@0.4.0

## 0.4.1

### Patch Changes

- [`4f8a247`](https://github.com/featureboard/sdks/commit/4f8a247620047c9b7f950e8a03b30f5de56cb687) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Improved debug logs

* [`4f8a247`](https://github.com/featureboard/sdks/commit/4f8a247620047c9b7f950e8a03b30f5de56cb687) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed useClient not connecting when api is undefined for initial render

* Updated dependencies [[`4f8a247`](https://github.com/featureboard/sdks/commit/4f8a247620047c9b7f950e8a03b30f5de56cb687)]:
  - @featureboard/js-sdk@0.3.1

## 0.4.0

### Minor Changes

- [`af7baef`](https://github.com/featureboard/sdks/commit/af7baef7e5b28d0906140617339e645d104b2195) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - SDK will automatically retry when it fails to start

  Live will fall back to fetching the initial values via HTTP then continue reconnecting in the background, HTTP will retry with backoff up to 4 times

### Patch Changes

- Updated dependencies [[`af7baef`](https://github.com/featureboard/sdks/commit/af7baef7e5b28d0906140617339e645d104b2195)]:
  - @featureboard/js-sdk@0.3.0

## 0.3.0

### Minor Changes

- [`ef075e9`](https://github.com/featureboard/sdks/commit/ef075e92dc7609125fca7a794690b160e57e74cb) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed return types from useClient

## 0.2.0

### Minor Changes

- [`26b573f`](https://github.com/featureboard/sdks/commit/26b573fffa906ba2bd6fedf473ecbd6ba9d1a56c) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Update useClient to return error if initialisation fails, allowing client to recover

## 0.1.2

### Patch Changes

- [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Update readme to point at documentation site

- Updated dependencies [[`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/featureboard/sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35)]:
  - @featureboard/js-sdk@0.2.0

## 0.1.1

### Patch Changes

- [`0ad794a`](https://github.com/featureboard/sdks/commit/0ad794ab5edfa75cc3e0ef073f765b6ab9de0fb8) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed useFeature hook not returning current value during inital render

## 0.1.0

### Minor Changes

- [`ddee7b3`](https://github.com/featureboard/sdks/commit/ddee7b3dec288ee1f8920a750de29706f79a512f) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies and fixed IWebSocket.send argument type

### Patch Changes

- Updated dependencies [[`ddee7b3`](https://github.com/featureboard/sdks/commit/ddee7b3dec288ee1f8920a750de29706f79a512f)]:
  - @featureboard/js-sdk@0.1.0

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
