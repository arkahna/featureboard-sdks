---
'@featureboard/js-sdk': minor
---

BREAKING: Major update to SDKs:

- 'live' support has been temporarily dropped
- Creating SDK instance is no longer async, this allows the SDK to be created with existing values and used immediately
- Much nicer support for initialising the SDK with existing values (for example from SSR)
