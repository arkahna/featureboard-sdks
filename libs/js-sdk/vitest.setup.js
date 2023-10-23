import { fetch, Headers, Request, Response } from 'cross-fetch'

// Add `fetch` polyfill.
global.fetch = fetch
global.Headers = Headers
global.Request = Request
global.Response = Response
