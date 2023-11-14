# @featureboard/js-sdk

## 0.15.2

### Patch Changes

- 1601a44: Fix for uncaught ReferenceError: process is not defined

## 0.15.1

### Patch Changes

- 5755d8f: Updated documentation and instructions
- Updated dependencies [5755d8f]
  - @featureboard/contracts@0.4.1

## 0.15.0

### Minor Changes

- 7587dae: Add support for modern bundlers

### Patch Changes

- Updated dependencies [7587dae]
  - @featureboard/contracts@0.4.0

## 0.14.0

### Minor Changes

- [#37](https://github.com/arkahna/featureboard-sdks/pull/37) [`81147bc`](https://github.com/arkahna/featureboard-sdks/commit/81147bc3a36f6ee390ecbe28e4281ad3f5eae635) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Add manual client which can be used to easily provide static feature values

## 0.13.2

### Patch Changes

- [#32](https://github.com/arkahna/featureboard-sdks/pull/32) [`ffbe263`](https://github.com/arkahna/featureboard-sdks/commit/ffbe263aa2008fd22b34fda0db79dae3e00c2746) Thanks [@idadaniels](https://github.com/idadaniels)! - Fix readme links

- Updated dependencies [[`ffbe263`](https://github.com/arkahna/featureboard-sdks/commit/ffbe263aa2008fd22b34fda0db79dae3e00c2746)]:
  - @featureboard/contracts@0.3.2

## 0.13.1

### Patch Changes

- [#30](https://github.com/arkahna/featureboard-sdks/pull/30) [`c5bec3d`](https://github.com/arkahna/featureboard-sdks/commit/c5bec3dc55c4ee271bb9a6ffe30ef9ba6089e1df) Thanks [@idadaniels](https://github.com/idadaniels)! - Update readme

- Updated dependencies [[`c5bec3d`](https://github.com/arkahna/featureboard-sdks/commit/c5bec3dc55c4ee271bb9a6ffe30ef9ba6089e1df)]:
  - @featureboard/contracts@0.3.1

## 0.13.0

### Minor Changes

- [#24](https://github.com/arkahna/featureboard-sdks/pull/24) [`edcd744`](https://github.com/arkahna/featureboard-sdks/commit/edcd74424971dfc5f513164a891444af1b5fcf5d) Thanks [@idadaniels](https://github.com/idadaniels)! - Replaced last-modified and if-modified-since headers with etag and if-none-match headers when fetching features

## 0.12.0

### Minor Changes

- [#16](https://github.com/arkahna/featureboard-sdks/pull/16) [`0441b3a`](https://github.com/arkahna/featureboard-sdks/commit/0441b3a776b11d1f4298657f2acad7d37926c98d) Thanks [@idadaniels](https://github.com/idadaniels)! - - Added External State Store to Node SDK.
  - Added retry functionality to browser client and server client.
  - Added error handling during initialisation stage.
  - Updated useClient() to include error handling

## 0.11.2

### Patch Changes

- [#12](https://github.com/arkahna/featureboard-sdks/pull/12) [`7cfb2ae`](https://github.com/arkahna/featureboard-sdks/commit/7cfb2aea5ed8e3eb25690e8a978df5d7aabe649d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed initialisation issue when audiences are updated

## 0.11.1

### Patch Changes

- [#11](https://github.com/arkahna/featureboard-sdks/pull/11) [`0c64eea`](https://github.com/arkahna/featureboard-sdks/commit/0c64eeaa2dba2cdc0d6c6a7482dc02b819654f61) Thanks [@idadaniels](https://github.com/idadaniels)! - Fix for 'initialised undefined' bug

## 0.11.0

### Minor Changes

- [#10](https://github.com/arkahna/featureboard-sdks/pull/10) [`a77deec`](https://github.com/arkahna/featureboard-sdks/commit/a77deec3dc8321d28f02533284a4e55a7125d931) Thanks [@idadaniels](https://github.com/idadaniels)! - Fix package command

### Patch Changes

- Updated dependencies [[`a77deec`](https://github.com/arkahna/featureboard-sdks/commit/a77deec3dc8321d28f02533284a4e55a7125d931)]:
  - @featureboard/contracts@0.3.0

## 0.10.0

### Minor Changes

- [#9](https://github.com/arkahna/featureboard-sdks/pull/9) [`ae67725`](https://github.com/arkahna/featureboard-sdks/commit/ae67725494742c9225ef9420a98775ff218e4dd6) Thanks [@idadaniels](https://github.com/idadaniels)! - Fixed issues around caching and instance management in React

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed issue with /all not waiting for initial request value

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Removed fetchInstance, requires fetch global to be present for both browser and node SDKs

- [`acc3ac1`](https://github.com/arkahna/featureboard-sdks/commit/acc3ac138925f876e5e63079f9e7802f8b85e2f4) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies

- [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Ignore effective values for stale audience (when current audiences change while update request is in flight)

- [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Logging updates

- [#5](https://github.com/arkahna/featureboard-sdks/pull/5) [`52cb569`](https://github.com/arkahna/featureboard-sdks/commit/52cb5696360475987b4d8a6cacd82e0b1e237849) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - BREAKING: Major update to SDKs:

  - 'live' support has been temporarily dropped
  - Creating SDK instance is no longer async, this allows the SDK to be created with existing values and used immediately
  - Much nicer support for initialising the SDK with existing values (for example from SSR)

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgraded dependencies

### Patch Changes

- [`1f626a5`](https://github.com/arkahna/featureboard-sdks/commit/1f626a5f75214f0dc704338a45da3d14eb7ccedd) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Better failure when fetch not defined globally

- [`84398cb`](https://github.com/arkahna/featureboard-sdks/commit/84398cb8aa19b371cf2a6f68776b211c3ec4c0fb) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed not removing unavailable feature

- [`f8382cf`](https://github.com/arkahna/featureboard-sdks/commit/f8382cf935ef68253db1056257efc8b00f50e447) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed interval not being bound to window

- [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Handle promise rejection on failed poll update

- [`1992790`](https://github.com/arkahna/featureboard-sdks/commit/1992790d52454f1bba2b60dec4fac089abab7f54) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed exports

- Updated dependencies [[`ae67725`](https://github.com/arkahna/featureboard-sdks/commit/ae67725494742c9225ef9420a98775ff218e4dd6), [`1992790`](https://github.com/arkahna/featureboard-sdks/commit/1992790d52454f1bba2b60dec4fac089abab7f54)]:
  - @featureboard/contracts@0.2.0

## 0.10.0-beta.7

### Minor Changes

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed issue with /all not waiting for initial request value

* [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Removed fetchInstance, requires fetch global to be present for both browser and node SDKs

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgraded dependencies

## 0.10.0-beta.6

### Minor Changes

- [`acc3ac1`](https://github.com/arkahna/featureboard-sdks/commit/acc3ac138925f876e5e63079f9e7802f8b85e2f4) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies

## 0.10.0-beta.5

### Minor Changes

- [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Ignore effective values for stale audience (when current audiences change while update request is in flight)

* [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Logging updates

### Patch Changes

- [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Handle promise rejection on failed poll update

## 0.10.0-beta.4

### Patch Changes

- [`1992790`](https://github.com/arkahna/featureboard-sdks/commit/1992790d52454f1bba2b60dec4fac089abab7f54) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed exports

- Updated dependencies [[`1992790`](https://github.com/arkahna/featureboard-sdks/commit/1992790d52454f1bba2b60dec4fac089abab7f54)]:
  - @featureboard/contracts@0.1.1-beta.0

## 0.10.0-beta.3

### Patch Changes

- [`84398cb`](https://github.com/arkahna/featureboard-sdks/commit/84398cb8aa19b371cf2a6f68776b211c3ec4c0fb) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed not removing unavailable feature

## 0.10.0-beta.2

### Patch Changes

- [`1f626a5`](https://github.com/arkahna/featureboard-sdks/commit/1f626a5f75214f0dc704338a45da3d14eb7ccedd) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Better failure when fetch not defined globally

## 0.10.0-beta.1

### Patch Changes

- [`f8382cf`](https://github.com/arkahna/featureboard-sdks/commit/f8382cf935ef68253db1056257efc8b00f50e447) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed interval not being bound to window

## 0.10.0-beta.0

### Minor Changes

- [#5](https://github.com/arkahna/featureboard-sdks/pull/5) [`52cb569`](https://github.com/arkahna/featureboard-sdks/commit/52cb5696360475987b4d8a6cacd82e0b1e237849) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - BREAKING: Major update to SDKs:

  - 'live' support has been temporarily dropped
  - Creating SDK instance is no longer async, this allows the SDK to be created with existing values and used immediately
  - Much nicer support for initialising the SDK with existing values (for example from SSR)

## 0.9.0

### Minor Changes

- [`9a56897`](https://github.com/arkahna/featureboard-sdks/commit/9a568972a53e8c214ba1000e8b44695572358402) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Allowed updating of audiences in client SDK

### Patch Changes

- [`9a56897`](https://github.com/arkahna/featureboard-sdks/commit/9a568972a53e8c214ba1000e8b44695572358402) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed missing @featureboard/contracts dependency

## 0.8.0

### Minor Changes

- [#4](https://github.com/arkahna/featureboard-sdks/pull/4) [`71895c7`](https://github.com/arkahna/featureboard-sdks/commit/71895c79c29a73a3e9ceb8b122330d746146311d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Add client.getEffectiveValues and FeatureBoardService.initStatic to allow a FeatureBoard client to be created from server side render values

## 0.7.1

### Patch Changes

- [`7e12285`](https://github.com/arkahna/featureboard-sdks/commit/7e12285a1c5524f64e005332f816259d9841a5e0) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Change debug logs to single line formatting

## 0.7.0

### Minor Changes

- [`a36b125`](https://github.com/arkahna/featureboard-sdks/commit/a36b125ade4804ee29ca97edc8a1651774864689) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Extended lib debug logs

## 0.6.0

### Minor Changes

- [`c346fd3`](https://github.com/arkahna/featureboard-sdks/commit/c346fd3c73033bc56c1bb6c787567ced0964e454) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Better timeout handling

## 0.5.0

### Minor Changes

- [`d10113f`](https://github.com/arkahna/featureboard-sdks/commit/d10113f9591c4827591945f7dca846d222a2039f) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Improve type safety of getFeatureValue function

## 0.4.0

### Minor Changes

- [`e7f2df6`](https://github.com/arkahna/featureboard-sdks/commit/e7f2df6af6d0b8bd2033c870f0c70bfe8f5fb113) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Added additional debug logging and close reason

### Patch Changes

- [`e7f2df6`](https://github.com/arkahna/featureboard-sdks/commit/e7f2df6af6d0b8bd2033c870f0c70bfe8f5fb113) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed timeout race always closing client connection

## 0.3.1

### Patch Changes

- [`4f8a247`](https://github.com/arkahna/featureboard-sdks/commit/4f8a247620047c9b7f950e8a03b30f5de56cb687) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Improved debug logs

## 0.3.0

### Minor Changes

- [`af7baef`](https://github.com/arkahna/featureboard-sdks/commit/af7baef7e5b28d0906140617339e645d104b2195) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - SDK will automatically retry when it fails to start

  Live will fall back to fetching the initial values via HTTP then continue reconnecting in the background, HTTP will retry with backoff up to 4 times

## 0.2.0

### Minor Changes

- [`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Added use of last-modfied into client header so server can return 304 if nothing has changed

* [`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Ensure only one request for features can be in flight at the same time

### Patch Changes

- [`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed wrong http method being used in the http client

* [`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Update readme to point at documentation site

## 0.1.0

### Minor Changes

- [`ddee7b3`](https://github.com/arkahna/featureboard-sdks/commit/ddee7b3dec288ee1f8920a750de29706f79a512f) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies and fixed IWebSocket.send argument type

## 0.0.3

### Patch Changes

- [`f04ab26`](https://github.com/arkahna/featureboard-sdks/commit/f04ab26936a742d493c693d83729ef264837f6c3) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Marked sdks as sideEffect free

## 0.0.2

### Patch Changes

- [`e268a7b`](https://github.com/arkahna/featureboard-sdks/commit/e268a7b45125808e42e81bcf849091e7b919d448) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed pacakge step
