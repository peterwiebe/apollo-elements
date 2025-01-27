import * as S from '@apollo-elements/test/schema';

import { createApolloClient } from './create-apollo-client';

import { expect } from '@open-wc/testing';

import { stub } from 'sinon';

function mockApiResponse<T>(body: T = {} as T) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-type': 'application/json' },
  });
}

describe('createApolloClient()', function() {
  describe('with uri', function() {
    let client: typeof window.__APOLLO_CLIENT__;

    beforeEach(function() {
      stub(window, 'fetch').resolves(mockApiResponse({ data: null }));
      client = createApolloClient({ uri: '/graphql' });
    });

    afterEach(function() {
      // @ts-expect-error: test
      window.fetch.restore();
      client = undefined;
    });

    describe('querying NonNull without params', function() {
      beforeEach(async function() {
        client!.query({ query: S.NonNullableParamQuery });
      });

      it('fetches', function() {
        expect(window.fetch).to.have.been.called;
      });
    });
  });

  describe('with uri and validateVariables set', function() {
    let client: typeof window.__APOLLO_CLIENT__;

    beforeEach(function() {
      stub(window, 'fetch');
      client = createApolloClient({ uri: '/graphql', validateVariables: true });
    });

    afterEach(function() {
      // @ts-expect-error: test
      window.fetch.restore();
      client = undefined;
    });

    describe('querying NonNull without params', function() {
      beforeEach(async function() {
        client!.query({ query: S.NonNullableParamQuery });
      });

      it('does not fetch', function() {
        expect(window.fetch).to.not.have.been.called;
      });
    });

    describe('querying NonNull with params', function() {
      beforeEach(async function() {
        client!.query<typeof S.NonNullableParamQuery>({
          query: S.NonNullableParamQuery,
          variables: { nonNull: 'thing' },
        }).catch(() => null);
      });

      it('fetches', function() {
        expect(window.fetch).to.have.been.called;
      });
    });
  });
});
