import type * as I from '@apollo-elements/core/types';

import type * as C from '@apollo/client/core';

import { aTimeout, fixture, expect, oneEvent, defineCE, nextFrame } from '@open-wc/testing';

import { gql, type OperationVariables } from '@apollo/client/core';

import { stub, spy } from 'sinon';

import {
  NullableParamMutationData,
  NullableParamMutationVariables,
  setupClient,
  stringify,
  teardownClient,
  TestableElement,
} from '@apollo-elements/test';

import { setupMutationClass, describeMutation } from '@apollo-elements/test/mutation.test';

import { GraphQLError } from 'graphql';

import './polymer-apollo-mutation';

import { PolymerApolloMutation } from './polymer-apollo-mutation';

import { PolymerElement, html } from '@polymer/polymer';
import { flush } from '@polymer/polymer/lib/utils/flush';

import * as S from '@apollo-elements/test/schema';

class TestableApolloMutation<D, V extends OperationVariables = I.VariablesOf<D>>
  extends PolymerApolloMutation<D, V>
  implements TestableElement {
  declare shadowRoot: ShadowRoot;

  static get template() {
    const template = document.createElement('template');
    template.innerHTML = /* html */`
      <output id="called"></output>
      <output id="data"></output>
      <output id="error"></output>
      <output id="errors"></output>
      <output id="loading"></output>
    `;
    return template;
  }

  $(id: keyof this) { return this.shadowRoot.getElementById(id as string); }

  observed: Array<keyof TestableApolloMutation<D, V>> = [
    'called',
    'data',
    'error',
    'errors',
    'loading',
  ];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.append(TestableApolloMutation.template.content.cloneNode(true));
  }

  render() {
    if (!this.shadowRoot) return;
    for (const key of this.observed)
      this.$(key)!.textContent = stringify(this[key]);
  }

  update() {
    this.render();
  }

  async hasRendered(): Promise<this> {
    await this.updateComplete;
    await nextFrame();
    flush();
    return this;
  }
}

class WrapperElement extends PolymerElement {
  declare shadowRoot: ShadowRoot;

  declare mutation: C.DocumentNode;

  declare variables: NullableParamMutationVariables;

  declare $: {
    button: HTMLButtonElement;
    mutation: PolymerApolloMutation<NullableParamMutationData, NullableParamMutationVariables>
  };

  static get properties() {
    return {
      mutation: { type: Object, value: () => S.NullableParamMutation },
      variables: { type: Object, value: () => ({ nullable: '🤡' }) },
    };
  }

  static get template() {
    return html`
      <polymer-apollo-mutation id="mutation"
          mutation="[[mutation]]"
          variables="[[variables]]"
          data="{{data}}">
      </polymer-apollo-mutation>

      <button id="button" on-click="onClick"></button>

      <output>[[data.nullableParam.nullable]]</output>
    `;
  }

  onClick() {
    this.$.mutation.onCompleted ??= spy();
    this.$.mutation.mutate();
  }
}

describe('[polymer] <polymer-apollo-mutation>', function() {
  describeMutation({
    class: TestableApolloMutation,
    setupFunction: setupMutationClass(TestableApolloMutation),
  });

  describe('notify events', function() {
    beforeEach(setupClient);
    afterEach(teardownClient);

    let element: PolymerApolloMutation;

    beforeEach(async function setupElement() {
      element = await fixture(`<polymer-apollo-mutation></polymer-apollo-mutation>`);
    });

    it('notifies on data change', async function() {
      const mutationStub = stub(element.client!, 'mutate');

      mutationStub.resolves({ data: { messages: ['hi'] } });

      const mutation = gql`mutation { messages }`;

      element.mutate({ mutation });

      const { detail: { value } } = await oneEvent(element, 'data-changed');

      expect(value).to.deep.equal({ messages: ['hi'] });
      mutationStub.restore();
    });

    it('notifies on error change', async function() {
      let err: Error;
      try {
        throw new Error('error');
      } catch (e) { err = e as Error; }
      setTimeout(() => element.error = err);
      const { detail: { value: { message } } } = await oneEvent(element, 'error-changed');
      expect(message).to.equal('error');
    });

    it('notifies on errors change', async function() {
      const errs = [new GraphQLError('error')];
      setTimeout(() => element.errors = errs);
      const { detail: { value } } = await oneEvent(element, 'errors-changed');
      expect(value).to.equal(errs);
    });

    it('notifies on loading change', async function() {
      setTimeout(() => element.loading = true);
      const { detail: { value } } = await oneEvent(element, 'loading-changed');
      expect(value).to.be.true;
    });

    it('notifies on called change', async function() {
      setTimeout(() => element.called = true);
      const { detail: { value } } = await oneEvent(element, 'called-changed');
      expect(value).to.be.true;
    });
  });

  describe('when used in a Polymer template', function() {
    beforeEach(setupClient);
    afterEach(teardownClient);

    let wrapper: WrapperElement;

    beforeEach(async function setupWrapper() {
      const tag = defineCE(class extends WrapperElement {});
      wrapper = await fixture<WrapperElement>(`<${tag}></${tag}>`);
    });

    beforeEach(function() {
      wrapper.$.button.click();
    });

    beforeEach(() => aTimeout(100));

    beforeEach(flush);

    it('binds data up into parent component', async function() {
      expect(wrapper).shadowDom.to.equal(`
        <polymer-apollo-mutation id="mutation"></polymer-apollo-mutation>
        <button id="button"></button>
        <output>🤡</output>
      `);
    });

    it('calls onCompleted', function() {
      expect(wrapper.$.mutation.onCompleted).to.have.been.calledOnce;
    });
  });
});
