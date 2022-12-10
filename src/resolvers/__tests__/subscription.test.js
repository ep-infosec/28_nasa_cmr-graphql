import nock from 'nock'

jest.mock('uuid', () => ({ v4: () => '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed' }))

import { ApolloServer } from 'apollo-server-lambda'

import resolvers from '..'
import typeDefs from '../../types'

import collectionSource from '../../datasources/collection'
import granuleSource from '../../datasources/granule'
import serviceSource from '../../datasources/service'
import {
  deleteSubscription as subscriptionSourceDelete,
  fetchSubscription as subscriptionSourceFetch,
  ingestSubscription as subscriptionSourceIngest
} from '../../datasources/subscription'
import toolSource from '../../datasources/tool'
import variableSource from '../../datasources/variable'

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: () => ({
    headers: {
      'CMR-Request-Id': 'abcd-1234-efgh-5678'
    }
  }),
  dataSources: () => ({
    collectionSource,
    granuleSource,
    serviceSource,
    subscriptionSourceDelete,
    subscriptionSourceFetch,
    subscriptionSourceIngest,
    toolSource,
    variableSource
  })
})

describe('Subscription', () => {
  const OLD_ENV = process.env

  beforeEach(() => {
    process.env = { ...OLD_ENV }

    process.env.cmrRootUrl = 'http://example.com'
    process.env.ummSubscriptionVersion = '1.1'
  })

  afterEach(() => {
    process.env = OLD_ENV
  })

  describe('Query', () => {
    test('all subscription fields', async () => {
      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Hits': 1,
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .post(/subscriptions\.umm_json/)
        .reply(200, {
          items: [{
            meta: {
              'concept-id': 'SUB100000-EDSC',
              'creation-date': '2022-05-26T18:47:26.351Z',
              'native-id': 'test-guid',
              'provider-id': 'EDSC',
              'revision-date': '2022-05-27T15:18:00.920Z',
              'revision-id': '1'
            },
            umm: {
              CollectionConceptId: 'C100000-EDSC',
              EmailAddress: 'test@example.com',
              Name: 'Test Subscription',
              Query: 'polygon=-18,-78,-13,-74,-16,-73,-22,-77,-18,-78',
              SubscriberId: 'testuser',
              Type: 'granule'
            }
          }]
        })

      const response = await server.executeOperation({
        subscriptions: {},
        query: `{
          subscriptions {
            count
            items {
              collectionConceptId
              conceptId
              creationDate
              emailAddress
              name
              nativeId
              providerId
              query
              revisionDate
              revisionId
              subscriberId
              type
            }
          }
        }`
      })

      const { data } = response

      expect(data).toEqual({
        subscriptions: {
          count: 1,
          items: [{
            collectionConceptId: 'C100000-EDSC',
            conceptId: 'SUB100000-EDSC',
            creationDate: '2022-05-26T18:47:26.351Z',
            emailAddress: 'test@example.com',
            name: 'Test Subscription',
            nativeId: 'test-guid',
            providerId: 'EDSC',
            query: 'polygon=-18,-78,-13,-74,-16,-73,-22,-77,-18,-78',
            revisionDate: '2022-05-27T15:18:00.920Z',
            revisionId: '1',
            subscriberId: 'testuser',
            type: 'granule'
          }]
        }
      })
    })

    test('subscriptions', async () => {
      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .post(/subscriptions\.json/, 'page_size=2')
        .reply(200, {
          items: [{
            concept_id: 'SUB100000-EDSC'
          }, {
            concept_id: 'SUB100001-EDSC'
          }]
        })

      const response = await server.executeOperation({
        subscriptions: {},
        query: `{
          subscriptions(params: { limit:2 }) {
            items {
              conceptId
            }
          }
        }`
      })

      const { data } = response

      expect(data).toEqual({
        subscriptions: {
          items: [{
            conceptId: 'SUB100000-EDSC'
          }, {
            conceptId: 'SUB100001-EDSC'
          }]
        }
      })
    })

    describe('subscription', () => {
      describe('with results', () => {
        test('returns results', async () => {
          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 7,
              'CMR-Request-Id': 'abcd-1234-efgh-5678'
            })
            .post(/subscriptions\.json/, 'concept_id=SUB100000-EDSC')
            .reply(200, {
              items: [{
                concept_id: 'SUB100000-EDSC'
              }]
            })

          const response = await server.executeOperation({
            subscriptions: {},
            query: `{
              subscription(params: { conceptId: "SUB100000-EDSC" }) {
                conceptId
              }
            }`
          })

          const { data } = response

          expect(data).toEqual({
            subscription: {
              conceptId: 'SUB100000-EDSC'
            }
          })
        })
      })

      describe('with no results', () => {
        test('returns no results', async () => {
          nock(/example/)
            .defaultReplyHeaders({
              'CMR-Took': 0,
              'CMR-Request-Id': 'abcd-1234-efgh-5678'
            })
            .post(/subscriptions\.json/, 'concept_id=SUB100000-EDSC')
            .reply(200, {
              items: []
            })

          const response = await server.executeOperation({
            subscriptions: {},
            query: `{
              subscription(params: { conceptId: "SUB100000-EDSC" }) {
                conceptId
              }
            }`
          })

          const { data } = response

          expect(data).toEqual({
            subscription: null
          })
        })
      })
    })
  })

  describe('Subscription', () => {
    test('collection', async () => {
      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .post(/subscriptions\.json/)
        .reply(200, {
          items: [{
            concept_id: 'SUB100000-EDSC',
            collection_concept_id: 'C100000-EDSC'
          }, {
            concept_id: 'SUB100001-EDSC',
            collection_concept_id: 'C100003-EDSC'
          }]
        })

      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .post(/collections\.json/, 'concept_id=C100000-EDSC&page_size=20')
        .reply(200, {
          feed: {
            entry: [{
              id: 'C100000-EDSC'
            }]
          }
        })

      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .post(/collections\.json/, 'concept_id=C100003-EDSC&page_size=20')
        .reply(200, {
          feed: {
            entry: [{
              id: 'C100003-EDSC'
            }]
          }
        })

      const response = await server.executeOperation({
        variables: {},
        query: `{
          subscriptions {
            items {
              conceptId
              collection {
                conceptId
              }
            }
          }
        }`
      })

      const { data } = response

      expect(data).toEqual({
        subscriptions: {
          items: [{
            conceptId: 'SUB100000-EDSC',
            collection: {
              conceptId: 'C100000-EDSC'
            }
          }, {
            conceptId: 'SUB100001-EDSC',
            collection: {
              conceptId: 'C100003-EDSC'
            }
          }]
        }
      })
    })

    test('collection when collectionConceptId does not exist', async () => {
      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .post(/subscriptions\.json/)
        .reply(200, {
          items: [{
            concept_id: 'SUB100000-EDSC',
            type: 'collection'
          }]
        })

      const response = await server.executeOperation({
        variables: {},
        query: `{
          subscriptions {
            items {
              conceptId
              collection {
                conceptId
              }
            }
          }
        }`
      })

      const { data } = response

      expect(data).toEqual({
        subscriptions: {
          items: [{
            conceptId: 'SUB100000-EDSC',
            collection: null
          }]
        }
      })
    })

    test('createSubscription for a granule subscription', async () => {
      nock(/example/, {
        reqheaders: {
          accept: 'application/json',
          'content-type': 'application/vnd.nasa.cmr.umm+json; version=1.1',
          'cmr-request-id': 'abcd-1234-efgh-5678'
        }
      })
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .put(/ingest\/subscriptions\/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/)
        .reply(201, {
          'concept-id': 'SUB100000-EDSC',
          'revision-id': '1'
        })

      const response = await server.executeOperation({
        variables: {
          collectionConceptId: 'C100000-EDSC',
          name: 'Test Subscription',
          query: 'polygon=-18,-78,-13,-74,-16,-73,-22,-77,-18,-78',
          subscriberId: 'testuser',
          type: 'granule'
        },
        query: `mutation CreateSubscription (
          $collectionConceptId: String
          $name: String!
          $query: String!
          $subscriberId: String
          $type: String!
        ) {
          createSubscription(
            params: {
              collectionConceptId: $collectionConceptId
              name: $name
              query: $query
              subscriberId: $subscriberId
              type: $type
            }
          ) {
              conceptId
              revisionId
            }
          }`
      })

      const { data } = response

      expect(data).toEqual({
        createSubscription: {
          conceptId: 'SUB100000-EDSC',
          revisionId: '1'
        }
      })
    })

    test('createSubscription for a collection subscription', async () => {
      nock(/example/, {
        reqheaders: {
          accept: 'application/json',
          'content-type': 'application/vnd.nasa.cmr.umm+json; version=1.1',
          'cmr-request-id': 'abcd-1234-efgh-5678'
        }
      })
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .put(/ingest\/subscriptions\/1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed/)
        .reply(201, {
          'concept-id': 'SUB100000-EDSC',
          'revision-id': '1'
        })

      const response = await server.executeOperation({
        variables: {
          name: 'Test Subscription',
          query: 'polygon=-18,-78,-13,-74,-16,-73,-22,-77,-18,-78',
          subscriberId: 'testuser',
          type: 'collection'
        },
        query: `mutation CreateSubscription (
          $name: String!
          $query: String!
          $subscriberId: String
          $type: String!
        ) {
          createSubscription(
            params: {
              name: $name
              query: $query
              subscriberId: $subscriberId
              type: $type
            }
          ) {
              conceptId
              revisionId
            }
          }`
      })

      const { data } = response

      expect(data).toEqual({
        createSubscription: {
          conceptId: 'SUB100000-EDSC',
          revisionId: '1'
        }
      })
    })

    test('updateSubscription', async () => {
      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .put(/ingest\/subscriptions\/test-guid/)
        .reply(201, {
          'concept-id': 'SUB100000-EDSC',
          'revision-id': '2'
        })

      const response = await server.executeOperation({
        variables: {
          collectionConceptId: 'C100000-EDSC',
          name: 'Test Subscription',
          nativeId: 'test-guid',
          query: 'polygon=-18,-78,-13,-74,-16,-73,-22,-77,-18,-78',
          subscriberId: 'testuser',
          type: 'granule'
        },
        query: `mutation UpdateSubscription (
          $collectionConceptId: String
          $name: String!
          $nativeId: String!
          $query: String!
          $subscriberId: String
          $type: String!
        ) {
          updateSubscription(
            params: {
              collectionConceptId: $collectionConceptId
              name: $name
              nativeId: $nativeId
              query: $query
              subscriberId: $subscriberId
              type: $type
            }
          ) {
              conceptId
              revisionId
            }
          }`
      })

      const { data } = response

      expect(data).toEqual({
        updateSubscription: {
          conceptId: 'SUB100000-EDSC',
          revisionId: '2'
        }
      })
    })

    test('deleteSubscription', async () => {
      nock(/example/)
        .defaultReplyHeaders({
          'CMR-Took': 7,
          'CMR-Request-Id': 'abcd-1234-efgh-5678'
        })
        .delete(/ingest\/subscriptions\/test-guid/)
        .reply(201, {
          'concept-id': 'SUB100000-EDSC',
          'revision-id': '2'
        })

      const response = await server.executeOperation({
        variables: {
          conceptId: 'SUB100000-EDSC',
          nativeId: 'test-guid'
        },
        query: `mutation DeleteSubscription (
          $conceptId: String!
          $nativeId: String!
        ) {
          deleteSubscription(
            params: {
              conceptId: $conceptId
              nativeId: $nativeId
            }
          ) {
              conceptId
              revisionId
            }
          }`
      })

      const { data } = response

      expect(data).toEqual({
        deleteSubscription: {
          conceptId: 'SUB100000-EDSC',
          revisionId: '2'
        }
      })
    })
  })
})
