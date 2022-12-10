import { parseCmrError } from '../parseCmrError'

describe('parseCmrError', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('returns an empty object when no response object is found', () => {
    const error = {}

    const response = parseCmrError(error)

    expect(response).toEqual({})
  })

  test('logs the error and re throws the exception by default', () => {
    const consoleMock = jest.spyOn(console, 'log')

    const error = {
      response: {
        data: {
          errors: ['HTTP Error']
        },
        headers: {
          'cmr-request-id': 'abcd-1234-efgh-5678'
        }
      }
    }

    expect(() => parseCmrError(error)).toThrow()

    expect(consoleMock).toBeCalledTimes(1)
    expect(consoleMock).toBeCalledWith('Request abcd-1234-efgh-5678 experienced an error: HTTP Error')
  })

  test('logs the error and re throws the exception by default', () => {
    const consoleMock = jest.spyOn(console, 'log')

    const error = {
      response: {
        data: {
          errors: ['Token does not exist']
        },
        headers: {
          'cmr-request-id': 'abcd-1234-efgh-5678'
        },
        status: 401
      }
    }

    expect(() => parseCmrError(error)).toThrow()

    expect(consoleMock).toBeCalledTimes(1)
    expect(consoleMock).toBeCalledWith('Request abcd-1234-efgh-5678 experienced an error: Token does not exist')
  })

  test('logs the error and returns the response when reThrow is false', () => {
    const consoleMock = jest.spyOn(console, 'log')

    const error = {
      response: {
        data: {
          errors: ['HTTP Error']
        },
        headers: {
          'cmr-request-id': 'abcd-1234-efgh-5678'
        }
      }
    }

    const response = parseCmrError(error, false)

    expect(consoleMock).toBeCalledTimes(1)
    expect(consoleMock).toBeCalledWith('Request abcd-1234-efgh-5678 experienced an error: HTTP Error')

    expect(response).toEqual({
      errors: ['HTTP Error']
    })
  })
})
