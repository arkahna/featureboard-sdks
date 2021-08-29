---
'@featureboard/js-sdk': minor
'@featureboard/node-sdk': minor
'@featureboard/react-sdk': minor
---

SDK will automatically retry when it fails to start

Live will fall back to fetching the initial values via HTTP then continue reconnecting in the background, HTTP will retry with backoff up to 4 times
