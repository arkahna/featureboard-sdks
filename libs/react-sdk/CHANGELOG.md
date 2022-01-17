# @featureboard/react-sdk

## 0.6.1-beta.2

### Patch Changes

- [`1f626a5`](https://github.com/featureboard/sdks/commit/1f626a5f75214f0dc704338a45da3d14eb7ccedd) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Better failure when fetch not defined globally

- Updated dependencies [[`1f626a5`](https://github.com/featureboard/sdks/commit/1f626a5f75214f0dc704338a45da3d14eb7ccedd)]:
  - @featureboard/js-sdk@0.10.0-beta.2

## 0.6.1-beta.1

### Patch Changes

- Updated dependencies [[`f8382cf`](https://github.com/featureboard/sdks/commit/f8382cf935ef68253db1056257efc8b00f50e447)]:
  - @featureboard/js-sdk@0.10.0-beta.1

## 0.6.1-beta.0

### Patch Changes

- Updated dependencies [[`52cb569`](https://github.com/featureboard/sdks/commit/52cb5696360475987b4d8a6cacd82e0b1e237849)]:
  - @featureboard/js-sdk@0.10.0-beta.0

## 0.6.0

### Minor Changes

- [`9a56897`](https://github.com/featureboard/sdks/commit/9a568972a53e8c214ba1000e8b44695572358402) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed updating audiences with useFeature hooks still subscribed to original store

### Patch Changes

- Updated dependencies [[`9a56897`](https://github.com/featureboard/sdks/commit/9a568972a53e8c214ba1000e8b44695572358402), [`9a56897`](https://github.com/featureboard/sdks/commit/9a568972a53e8c214ba1000e8b44695572358402)]:
  - @featureboard/js-sdk@0.9.0

## 0.5.0

### Minor Changes

- [#4](https://github.com/featureboard/sdks/pull/4) [`71895c7`](https://github.com/featureboard/sdks/commit/71895c79c29a73a3e9ceb8b122330d746146311d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Add client.getEffectiveValues and FeatureBoardService.initStatic to allow a FeatureBoard client to be created from server side render values

### Patch Changes

- Updated dependencies [[`71895c7`](https://github.com/featureboard/sdks/commit/71895c79c29a73a3e9ceb8b122330d746146311d)]:
  - @featureboard/js-sdk@0.8.0

## 0.4.6

### Patch Changes

- Updated dependencies [[`7e12285`](https://github.com/featureboard/sdks/commit/7e12285a1c5524f64e005332f816259d9841a5e0)]:
  - @featureboard/js-sdk@0.7.1

## 0.4.5

### Patch Changes

- Updated dependencies [[`a36b125`](https://github.com/featureboard/sdks/commit/a36b125ade4804ee29ca97edc8a1651774864689)]:
  - @featureboard/js-sdk@0.7.0

## 0.4.4

### Patch Changes

- Updated dependencies [[`c346fd3`](https://github.com/featureboard/sdks/commit/c346fd3c73033bc56c1bb6c787567ced0964e454)]:
  - @featureboard/js-sdk@0.6.0

## 0.4.3

### Patch Changes

- Updated dependencies [[`d10113f`](https://github.com/featureboard/sdks/commit/d10113f9591c4827591945f7dca846d222a2039f)]:
  - @featureboard/js-sdk@0.5.0

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
