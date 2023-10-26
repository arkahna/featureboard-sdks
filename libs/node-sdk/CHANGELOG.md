# @featureboard/node-sdk

## 0.17.0

### Minor Changes

- 7587dae: Add support for modern bundlers

### Patch Changes

- Updated dependencies [7587dae]
  - @featureboard/js-sdk@0.15.0

## 0.16.0

### Minor Changes

- [#40](https://github.com/arkahna/featureboard-sdks/pull/40) [`c35ba12`](https://github.com/arkahna/featureboard-sdks/commit/c35ba12fb831185607d3e91b574d43772f80785f) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Add manualServerClient which enables using the manualClient on the server easily

## 0.15.3

### Patch Changes

- Updated dependencies [[`81147bc`](https://github.com/arkahna/featureboard-sdks/commit/81147bc3a36f6ee390ecbe28e4281ad3f5eae635)]:
  - @featureboard/js-sdk@0.14.0

## 0.15.2

### Patch Changes

- [#32](https://github.com/arkahna/featureboard-sdks/pull/32) [`ffbe263`](https://github.com/arkahna/featureboard-sdks/commit/ffbe263aa2008fd22b34fda0db79dae3e00c2746) Thanks [@idadaniels](https://github.com/idadaniels)! - Fix readme links

- Updated dependencies [[`ffbe263`](https://github.com/arkahna/featureboard-sdks/commit/ffbe263aa2008fd22b34fda0db79dae3e00c2746)]:
  - @featureboard/js-sdk@0.13.2

## 0.15.1

### Patch Changes

- [#30](https://github.com/arkahna/featureboard-sdks/pull/30) [`c5bec3d`](https://github.com/arkahna/featureboard-sdks/commit/c5bec3dc55c4ee271bb9a6ffe30ef9ba6089e1df) Thanks [@idadaniels](https://github.com/idadaniels)! - Update readme

- Updated dependencies [[`c5bec3d`](https://github.com/arkahna/featureboard-sdks/commit/c5bec3dc55c4ee271bb9a6ffe30ef9ba6089e1df)]:
  - @featureboard/js-sdk@0.13.1

## 0.15.0

### Minor Changes

- [#24](https://github.com/arkahna/featureboard-sdks/pull/24) [`edcd744`](https://github.com/arkahna/featureboard-sdks/commit/edcd74424971dfc5f513164a891444af1b5fcf5d) Thanks [@idadaniels](https://github.com/idadaniels)! - Replaced last-modified and if-modified-since headers with etag and if-none-match headers when fetching features

### Patch Changes

- Updated dependencies [[`edcd744`](https://github.com/arkahna/featureboard-sdks/commit/edcd74424971dfc5f513164a891444af1b5fcf5d)]:
  - @featureboard/js-sdk@0.13.0

## 0.14.0

### Minor Changes

- [#16](https://github.com/arkahna/featureboard-sdks/pull/16) [`0441b3a`](https://github.com/arkahna/featureboard-sdks/commit/0441b3a776b11d1f4298657f2acad7d37926c98d) Thanks [@idadaniels](https://github.com/idadaniels)! - - Added External State Store to Node SDK.
  - Added retry functionality to browser client and server client.
  - Added error handling during initialisation stage.
  - Updated useClient() to include error handling

### Patch Changes

- Updated dependencies [[`0441b3a`](https://github.com/arkahna/featureboard-sdks/commit/0441b3a776b11d1f4298657f2acad7d37926c98d)]:
  - @featureboard/js-sdk@0.12.0

## 0.13.2

### Patch Changes

- Updated dependencies [[`7cfb2ae`](https://github.com/arkahna/featureboard-sdks/commit/7cfb2aea5ed8e3eb25690e8a978df5d7aabe649d)]:
  - @featureboard/js-sdk@0.11.2

## 0.13.1

### Patch Changes

- Updated dependencies [[`0c64eea`](https://github.com/arkahna/featureboard-sdks/commit/0c64eeaa2dba2cdc0d6c6a7482dc02b819654f61)]:
  - @featureboard/js-sdk@0.11.1

## 0.13.0

### Minor Changes

- [#10](https://github.com/arkahna/featureboard-sdks/pull/10) [`a77deec`](https://github.com/arkahna/featureboard-sdks/commit/a77deec3dc8321d28f02533284a4e55a7125d931) Thanks [@idadaniels](https://github.com/idadaniels)! - Fix package command

### Patch Changes

- Updated dependencies [[`a77deec`](https://github.com/arkahna/featureboard-sdks/commit/a77deec3dc8321d28f02533284a4e55a7125d931)]:
  - @featureboard/js-sdk@0.11.0

## 0.12.0

### Minor Changes

- [#9](https://github.com/arkahna/featureboard-sdks/pull/9) [`ae67725`](https://github.com/arkahna/featureboard-sdks/commit/ae67725494742c9225ef9420a98775ff218e4dd6) Thanks [@idadaniels](https://github.com/idadaniels)! - Fixed issues around caching and instance management in React

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed issue with /all not waiting for initial request value

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Removed fetchInstance, requires fetch global to be present for both browser and node SDKs

- [`acc3ac1`](https://github.com/arkahna/featureboard-sdks/commit/acc3ac138925f876e5e63079f9e7802f8b85e2f4) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies

- [#7](https://github.com/arkahna/featureboard-sdks/pull/7) [`cb6742d`](https://github.com/arkahna/featureboard-sdks/commit/cb6742ddb9418afc61a0cd91ba02735f49ca1eda) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed an issue with an unavailable feature not being removed from the store

- [#5](https://github.com/arkahna/featureboard-sdks/pull/5) [`52cb569`](https://github.com/arkahna/featureboard-sdks/commit/52cb5696360475987b4d8a6cacd82e0b1e237849) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - BREAKING: Major update to SDKs

  - 'live' support has been temporarily dropped
  - Creating SDK instance is no longer async, this allows the SDK to be created with existing values and used immediately

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgraded dependencies

### Patch Changes

- [`4eac877`](https://github.com/arkahna/featureboard-sdks/commit/4eac877565295c87205b34d7b60219f6143462df) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Downgraded node-fetch to a version which supports commonjs

- [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Handle promise rejection on failed poll update

- [`1992790`](https://github.com/arkahna/featureboard-sdks/commit/1992790d52454f1bba2b60dec4fac089abab7f54) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed exports

- [`a22067a`](https://github.com/arkahna/featureboard-sdks/commit/a22067acd8b05b2230ac6fc024bb7badeeb77726) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed incorrect url

- Updated dependencies [[`ae67725`](https://github.com/arkahna/featureboard-sdks/commit/ae67725494742c9225ef9420a98775ff218e4dd6), [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9), [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9), [`acc3ac1`](https://github.com/arkahna/featureboard-sdks/commit/acc3ac138925f876e5e63079f9e7802f8b85e2f4), [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b), [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b), [`1f626a5`](https://github.com/arkahna/featureboard-sdks/commit/1f626a5f75214f0dc704338a45da3d14eb7ccedd), [`84398cb`](https://github.com/arkahna/featureboard-sdks/commit/84398cb8aa19b371cf2a6f68776b211c3ec4c0fb), [`f8382cf`](https://github.com/arkahna/featureboard-sdks/commit/f8382cf935ef68253db1056257efc8b00f50e447), [`52cb569`](https://github.com/arkahna/featureboard-sdks/commit/52cb5696360475987b4d8a6cacd82e0b1e237849), [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b), [`1992790`](https://github.com/arkahna/featureboard-sdks/commit/1992790d52454f1bba2b60dec4fac089abab7f54), [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9)]:
  - @featureboard/js-sdk@0.10.0

## 0.12.0-beta.10

### Minor Changes

- [#7](https://github.com/arkahna/featureboard-sdks/pull/7) [`cb6742d`](https://github.com/arkahna/featureboard-sdks/commit/cb6742ddb9418afc61a0cd91ba02735f49ca1eda) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed an issue with an unavailable feature not being removed from the store

## 0.12.0-beta.9

### Minor Changes

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed issue with /all not waiting for initial request value

* [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Removed fetchInstance, requires fetch global to be present for both browser and node SDKs

- [#6](https://github.com/arkahna/featureboard-sdks/pull/6) [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgraded dependencies

### Patch Changes

- Updated dependencies [[`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9), [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9), [`512fa7b`](https://github.com/arkahna/featureboard-sdks/commit/512fa7bb097320755aa82a5390019cbea1514ac9)]:
  - @featureboard/js-sdk@0.10.0-beta.7

## 0.12.0-beta.8

### Minor Changes

- [`acc3ac1`](https://github.com/arkahna/featureboard-sdks/commit/acc3ac138925f876e5e63079f9e7802f8b85e2f4) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies

### Patch Changes

- Updated dependencies [[`acc3ac1`](https://github.com/arkahna/featureboard-sdks/commit/acc3ac138925f876e5e63079f9e7802f8b85e2f4)]:
  - @featureboard/js-sdk@0.10.0-beta.6

## 0.12.0-beta.7

### Patch Changes

- [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Handle promise rejection on failed poll update

- Updated dependencies [[`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b), [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b), [`fd8731d`](https://github.com/arkahna/featureboard-sdks/commit/fd8731d62576a1f1ddbb9b810570dfedad1de39b)]:
  - @featureboard/js-sdk@0.10.0-beta.5

## 0.12.0-beta.6

### Patch Changes

- [`1992790`](https://github.com/arkahna/featureboard-sdks/commit/1992790d52454f1bba2b60dec4fac089abab7f54) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed exports

- Updated dependencies [[`1992790`](https://github.com/arkahna/featureboard-sdks/commit/1992790d52454f1bba2b60dec4fac089abab7f54)]:
  - @featureboard/js-sdk@0.10.0-beta.4

## 0.12.0-beta.5

### Patch Changes

- Updated dependencies [[`84398cb`](https://github.com/arkahna/featureboard-sdks/commit/84398cb8aa19b371cf2a6f68776b211c3ec4c0fb)]:
  - @featureboard/js-sdk@0.10.0-beta.3

## 0.12.0-beta.4

### Patch Changes

- Updated dependencies [[`1f626a5`](https://github.com/arkahna/featureboard-sdks/commit/1f626a5f75214f0dc704338a45da3d14eb7ccedd)]:
  - @featureboard/js-sdk@0.10.0-beta.2

## 0.12.0-beta.3

### Patch Changes

- Updated dependencies [[`f8382cf`](https://github.com/arkahna/featureboard-sdks/commit/f8382cf935ef68253db1056257efc8b00f50e447)]:
  - @featureboard/js-sdk@0.10.0-beta.1

## 0.12.0-beta.2

### Patch Changes

- [`a22067a`](https://github.com/arkahna/featureboard-sdks/commit/a22067acd8b05b2230ac6fc024bb7badeeb77726) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed incorrect url

## 0.12.0-beta.1

### Patch Changes

- [`4eac877`](https://github.com/arkahna/featureboard-sdks/commit/4eac877565295c87205b34d7b60219f6143462df) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Downgraded node-fetch to a version which supports commonjs

## 0.12.0-beta.0

### Minor Changes

- [#5](https://github.com/arkahna/featureboard-sdks/pull/5) [`52cb569`](https://github.com/arkahna/featureboard-sdks/commit/52cb5696360475987b4d8a6cacd82e0b1e237849) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - BREAKING: Major update to SDKs

  - 'live' support has been temporarily dropped
  - Creating SDK instance is no longer async, this allows the SDK to be created with existing values and used immediately

### Patch Changes

- Updated dependencies [[`52cb569`](https://github.com/arkahna/featureboard-sdks/commit/52cb5696360475987b4d8a6cacd82e0b1e237849)]:
  - @featureboard/js-sdk@0.10.0-beta.0

## 0.11.0

### Minor Changes

- [`9a56897`](https://github.com/arkahna/featureboard-sdks/commit/9a568972a53e8c214ba1000e8b44695572358402) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Allowed updating of audiences in client SDK

### Patch Changes

- Updated dependencies [[`9a56897`](https://github.com/arkahna/featureboard-sdks/commit/9a568972a53e8c214ba1000e8b44695572358402), [`9a56897`](https://github.com/arkahna/featureboard-sdks/commit/9a568972a53e8c214ba1000e8b44695572358402)]:
  - @featureboard/js-sdk@0.9.0

## 0.10.0

### Minor Changes

- [`361f44e`](https://github.com/arkahna/featureboard-sdks/commit/361f44e6eae6552a78a4bbad2b48b19e294e1e04) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed some type safety issues in the SDK which caused the new getEffectiveValues to be missing in some instances

## 0.9.2

### Patch Changes

- Updated dependencies [[`71895c7`](https://github.com/arkahna/featureboard-sdks/commit/71895c79c29a73a3e9ceb8b122330d746146311d)]:
  - @featureboard/js-sdk@0.8.0

## 0.9.1

### Patch Changes

- [`7e12285`](https://github.com/arkahna/featureboard-sdks/commit/7e12285a1c5524f64e005332f816259d9841a5e0) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Change debug logs to single line formatting

- Updated dependencies [[`7e12285`](https://github.com/arkahna/featureboard-sdks/commit/7e12285a1c5524f64e005332f816259d9841a5e0)]:
  - @featureboard/js-sdk@0.7.1

## 0.9.0

### Minor Changes

- [`9ff19b6`](https://github.com/arkahna/featureboard-sdks/commit/9ff19b6db7316dc20fe36c5d1cadfa121e2fedf0) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Add some additional debug logging around feature resolution

## 0.8.0

### Minor Changes

- [`a36b125`](https://github.com/arkahna/featureboard-sdks/commit/a36b125ade4804ee29ca97edc8a1651774864689) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Extended lib debug logs

### Patch Changes

- Updated dependencies [[`a36b125`](https://github.com/arkahna/featureboard-sdks/commit/a36b125ade4804ee29ca97edc8a1651774864689)]:
  - @featureboard/js-sdk@0.7.0

## 0.7.0

### Minor Changes

- [`c346fd3`](https://github.com/arkahna/featureboard-sdks/commit/c346fd3c73033bc56c1bb6c787567ced0964e454) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Switch node SDK default from live to polling

### Patch Changes

- Updated dependencies [[`c346fd3`](https://github.com/arkahna/featureboard-sdks/commit/c346fd3c73033bc56c1bb6c787567ced0964e454)]:
  - @featureboard/js-sdk@0.6.0

## 0.6.1

### Patch Changes

- Updated dependencies [[`d10113f`](https://github.com/arkahna/featureboard-sdks/commit/d10113f9591c4827591945f7dca846d222a2039f)]:
  - @featureboard/js-sdk@0.5.0

## 0.6.0

### Minor Changes

- [`e7f2df6`](https://github.com/arkahna/featureboard-sdks/commit/e7f2df6af6d0b8bd2033c870f0c70bfe8f5fb113) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Added additional debug logging and close reason

### Patch Changes

- Updated dependencies [[`e7f2df6`](https://github.com/arkahna/featureboard-sdks/commit/e7f2df6af6d0b8bd2033c870f0c70bfe8f5fb113), [`e7f2df6`](https://github.com/arkahna/featureboard-sdks/commit/e7f2df6af6d0b8bd2033c870f0c70bfe8f5fb113)]:
  - @featureboard/js-sdk@0.4.0

## 0.5.1

### Patch Changes

- [`4f8a247`](https://github.com/arkahna/featureboard-sdks/commit/4f8a247620047c9b7f950e8a03b30f5de56cb687) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Improved debug logs

- Updated dependencies [[`4f8a247`](https://github.com/arkahna/featureboard-sdks/commit/4f8a247620047c9b7f950e8a03b30f5de56cb687)]:
  - @featureboard/js-sdk@0.3.1

## 0.5.0

### Minor Changes

- [`af7baef`](https://github.com/arkahna/featureboard-sdks/commit/af7baef7e5b28d0906140617339e645d104b2195) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - SDK will automatically retry when it fails to start

  Live will fall back to fetching the initial values via HTTP then continue reconnecting in the background, HTTP will retry with backoff up to 4 times

### Patch Changes

- Updated dependencies [[`af7baef`](https://github.com/arkahna/featureboard-sdks/commit/af7baef7e5b28d0906140617339e645d104b2195)]:
  - @featureboard/js-sdk@0.3.0

## 0.4.0

### Minor Changes

- [`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Switch default strategy in node sdk to be polling

### Patch Changes

- Updated dependencies [[`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35), [`30bcd26`](https://github.com/arkahna/featureboard-sdks/commit/30bcd26fac6e5e7ea02dda54b09c088e891e1b35)]:
  - @featureboard/js-sdk@0.2.0

## 0.3.0

### Minor Changes

- [`3e8d085`](https://github.com/arkahna/featureboard-sdks/commit/3e8d085f07b09f4dd595f3351343d8e02c3c1179) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Allow a custom feature store to be specified, this allows users to persist/hydrate their initial features outside the SDK

* [`d7befc2`](https://github.com/arkahna/featureboard-sdks/commit/d7befc28c06bdfc8c30f5a4df29f526a9891904d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Implemented basic caching using Last-Modified headers in the SDK as most node fetch implementations do not support http caching, and the ones that do require additional configuration

- [`d7befc2`](https://github.com/arkahna/featureboard-sdks/commit/d7befc28c06bdfc8c30f5a4df29f526a9891904d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Add maxAgeMs option to on-request update strategy to cache responses in the SDK for 30 seconds by default

## 0.2.0

### Minor Changes

- [`ddee7b3`](https://github.com/arkahna/featureboard-sdks/commit/ddee7b3dec288ee1f8920a750de29706f79a512f) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Upgrade dependencies and fixed IWebSocket.send argument type

### Patch Changes

- Updated dependencies [[`ddee7b3`](https://github.com/arkahna/featureboard-sdks/commit/ddee7b3dec288ee1f8920a750de29706f79a512f)]:
  - @featureboard/js-sdk@0.1.0

## 0.1.0

### Minor Changes

- [#1](https://github.com/arkahna/featureboard-sdks/pull/1) [`8dc891f`](https://github.com/arkahna/featureboard-sdks/commit/8dc891faeb173e24471a4322f964cceb96df0dda) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Renamed audienceValues to audienceExceptions in server SDK

## 0.0.5

### Patch Changes

- [`ab7b7bb`](https://github.com/arkahna/featureboard-sdks/commit/ab7b7bbad7e11e0fa6d59c6b2279cdf6d1b24f9d) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Further fix for hang

## 0.0.4

### Patch Changes

- [`9d3ab09`](https://github.com/arkahna/featureboard-sdks/commit/9d3ab09cfc9345c084601632781d32992b0ca29c) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed awaiting .request() on server SDK when not using on-request mode hanging

## 0.0.3

### Patch Changes

- [`f04ab26`](https://github.com/arkahna/featureboard-sdks/commit/f04ab26936a742d493c693d83729ef264837f6c3) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Marked sdks as sideEffect free

- Updated dependencies [[`f04ab26`](https://github.com/arkahna/featureboard-sdks/commit/f04ab26936a742d493c693d83729ef264837f6c3)]:
  - @featureboard/js-sdk@0.0.3

## 0.0.2

### Patch Changes

- [`e268a7b`](https://github.com/arkahna/featureboard-sdks/commit/e268a7b45125808e42e81bcf849091e7b919d448) Thanks [@JakeGinnivan](https://github.com/JakeGinnivan)! - Fixed pacakge step

- Updated dependencies [[`e268a7b`](https://github.com/arkahna/featureboard-sdks/commit/e268a7b45125808e42e81bcf849091e7b919d448)]:
  - @featureboard/js-sdk@0.0.2
