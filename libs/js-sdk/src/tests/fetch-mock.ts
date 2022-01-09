import {
    FetchSignatureInit,
    FetchSignatureResponse,
} from '../utils/FetchSignature'

type FetchPredicate = (
    input: string,
    init: FetchSignatureInit | undefined,
) => undefined | FetchMockResponse

export interface FetchMockResponse {
    status: number
    body?: string
    headers?: Record<string, string>
}

interface RequestMatch {
    url: RegExp | string
    headers: Record<string, string>
}

export class FetchMock {
    constructor() {
        this.instance = this.instance.bind(this)
    }
    private mocks: Array<FetchPredicate> = []

    async instance(
        input: string,
        init: FetchSignatureInit | undefined,
    ): Promise<FetchSignatureResponse> {
        for (const mock of this.mocks) {
            const match = mock(input, init)
            if (match) {
                return {
                    status: match.status,
                    statusText: getStatusText(match.status),
                    json() {
                        return Promise.resolve(
                            match.body ? JSON.parse(match.body) : undefined,
                        )
                    },
                    headers: {
                        get(header) {
                            if (!match.headers) {
                                return null
                            }

                            return (
                                getHeaderCaseInsensitive(
                                    match.headers,
                                    header,
                                ) || null
                            )
                        },
                    },
                }
            }
        }

        return {
            status: 500,
            statusText: 'Unmatched route: ' + input,
            json: () =>
                Promise.resolve({ message: 'Unmatched route:' + input }),
            headers: {
                get: () => null,
            },
        }
    }

    match(predicate: FetchPredicate): FetchMock
    match(
        method: string,
        url: RegExp | string,
        response: FetchMockResponse,
    ): FetchMock
    match(
        predicateOrMethod: FetchPredicate | string,
        url: void | RegExp | string,
        response: void | FetchMockResponse,
    ): FetchMock {
        if (typeof predicateOrMethod === 'function') {
            this.mocks.push(predicateOrMethod)
        } else {
            this.mocks.push(
                matchSigToPredicate(predicateOrMethod, url!, response!),
            )
        }

        return this
    }

    matchOnce(predicate: FetchPredicate): FetchMock
    matchOnce(
        method: string,
        url: RegExp | string | RequestMatch,
        response: FetchMockResponse,
    ): FetchMock
    matchOnce(
        predicateOrMethod: FetchPredicate | string,
        url: void | RegExp | string | RequestMatch,
        response: FetchMockResponse | void,
    ): FetchMock {
        const predicate =
            typeof predicateOrMethod === 'function'
                ? predicateOrMethod
                : matchSigToPredicate(predicateOrMethod, url!, response!)

        this.mocks.push((input, init) => {
            const result = predicate(input, init)
            if (result) {
                this.mocks.splice(this.mocks.indexOf(predicate), 1)
            }
            return result
        })

        return this
    }
}

function getStatusText(status: number): string {
    if (status === 200) {
        return 'OK'
    }
    if (status === 500) {
        return 'Internal Server Error'
    }
    return ''
}

function matchSigToPredicate(
    method: string,
    match: RegExp | string | RequestMatch,
    response: FetchMockResponse,
): FetchPredicate {
    return (input, init) => {
        if (
            (init &&
                init.method &&
                init.method.toLowerCase() !== method.toLowerCase()) ||
            method.toLowerCase() !== 'get'
        ) {
            return
        }

        if (typeof match === 'object' && 'headers' in match) {
            if (
                !matchesUrl(match.url, input) ||
                !matchHeaders(match.headers, init?.headers)
            ) {
                return
            }
        } else if (!matchesUrl(match, input)) {
            return
        }

        return response
    }
}

function matchHeaders(
    headers: Record<string, string>,
    requestHeaders?: Record<string, string>,
): boolean {
    if (!requestHeaders) {
        return false
    }

    for (const header in headers) {
        if (headers[header] !== requestHeaders[header]) {
            return false
        }
    }

    return true
}

function matchesUrl(url: string | RegExp, input: string) {
    if (typeof url === 'string') {
        return input.includes(url)
    } else {
        return url.test(input)
    }
}

function getHeaderCaseInsensitive(
    headers: Record<string, string>,
    header: string,
) {
    for (const requestHeaderName in headers) {
        if (Object.prototype.hasOwnProperty.call(headers, requestHeaderName)) {
            if (requestHeaderName.toLowerCase() === header.toLowerCase()) {
                return headers[requestHeaderName]
            }
        }
    }
}
