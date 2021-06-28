---
description: 'Introducing the next evolution in GraphQL web apps with Apollo Elements: Reactive Controllers and dynamic HTML queries bring you more power and more flexibility.'
tags:
  - graphql
  - webcomponents
  - html
published: true
cover_image: /blog/next-evolution/social@2x.png
socialMediaImage: /blog/next-evolution/social@2x.png
date: 2021-07-01
updated: Last Modified
---

# The Next Evolution of GraphQL Front Ends

Apollo Elements has come a long way since its first release as `lit-apollo` in 2017. What started as a way to build GraphQL-querying LitElements has blossomed into a [multi-library](https://apolloelements.dev/api/libraries/), multi-paradigm project with [extensive docs](https://apolloelements.dev/api/).

Today we're releasing the next version of Apollo Elements' packages, including a major change: introducing GraphQL Controllers, and GraphQL HTML Elements.

## Reactive GraphQL Controllers
The latest version of [Lit](https://lit.dev) introduced a concept called "reactive controllers". They're a way to pack up reusable functionality in JavaScript classes that you can share between elements. If you've use JavaScript class mixins before (*not* the same as React mixins), they you're familiar with sharing code between elements. Controllers go one-better by being sharable and composable without requiring you to apply a mixin to the host element, as long as it implements the [`ReactiveControllerHost`](https://lit.dev/docs/composition/controllers/#controller-host-api) interface.

You can even have multiple copies of the same controller active on a given host. In the words of the Lit team, controllers represent a "has a _" relationship to the host element, where mixins represent an "is a _" relationship.

For Apollo Elements, it means now you can add many GraphQL operations to one component, like multiple queries or a query and a mutation. Here's an interactive example of the latter:

```ts playground multiple-controllers Users.ts
import type { TextField } from '@material/mwc-textfield';
import { ApolloQueryController, ApolloMutationController } from '@apollo-elements/core';
import { LitElement, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { UsersQuery, AddUserMutation } from './graphql.documents.js';
import { style } from './Users.css.js';

@customElement('users-view')
class UsersView extends LitElement {
  static styles = style;

  @query('mwc-textfield') nameField: TextField;

  users = new ApolloQueryController(this, UsersQuery);

  addUser = new ApolloMutationController(this, AddUserMutation, {
    awaitRefetchQueries: true,
    refetchQueries: [{ query: UsersQuery }],
  });

  onSubmit() { this.addUser.mutate({ variables: { name: this.nameField.value } }); }

  render() {
    const users = this.users.data?.users ?? [];
    const loading = this.users.loading || this.addUser.loading;
    return html`
      <form>
        <h2>Add a New User</h2>
        <mwc-textfield label="Name" ?disabled="${loading}"></mwc-textfield>
        <mwc-linear-progress indeterminate ?closed="${!loading}"></mwc-linear-progress>
        <mwc-button label="Submit" ?disabled="${loading}" @click="${this.onSubmit}"></mwc-button>
      </form>
      <h2>All Users</h2>
      <mwc-list>${users.map(x => html`
        <mwc-list-item noninteractive graphic="avatar">
          <img slot="graphic" ?hidden="${!x.picture}" .src="${x.picture}" role="presentation"/>
          ${x.name}
        </mwc-list-item>`)}
      </mwc-list>
    `;
  }
}
```

Controllers are great for lots of reasons. One reason we've found while developing and testing Apollo Elements is that unlike the class-based API of e.g. `@apollo-elements/lit-apollo` or `@apollo-elements/mixins`, when using controllers there's no need to pass in type parameters to the host class. By passing a [TypedDocumentNode](https://github.com/dotansimha/graphql-typed-document-node) object as the argument to the controller, you'll get that typechecking and autocomplete you know and love in your class template and methods, without awkward `<DataType, VarsType>` class generics.

If you're working on an existing app that uses Apollo Elements' base classes, not to worry, you can still `import { ApolloQuery } from '@apollo-elements/lit-apollo'`, We worked hard to keep the breaking changes to a minimum. Those base classes now use the controllers at their heart, so go ahead: mix-and-match query components with controller-host components in your app, it won't bloat your bundles.

We hope you have as much fun using Apollo Elements controllers as we've had writing them.

## Dynamic GraphQL templates in HTML
The previous major version of `@apollo-elements/components` included `<apollo-client>` and `<apollo-mutation>`. Those are still here and they're better than ever, but now they're part of a set with `<apollo-query>` and `<apollo-subscription>` as well.

With these new elements, and their older sibling `<apollo-mutation>`, you can write entire GraphQL apps in nothing but HTML. You read that right, declarative, data-driven GraphQL apps in HTML. You still have access to the Apollo Client API, so feel free to sprinkle in a little JS here and there for added spice.

This is all made possible by a pair of libraries from the Lit team's Justin Fagnani called [Stampino](https://github.com/justinfagnani/stampino/) and [jexpr](https://github.com/justinfagnani/jexpr/). Together, they let you define dynamic parts in HTML `<template>` elements, filling them with JavaScript expressions based on your GraphQL data.

Here's the demo app from above, but written in HTML:

```html playground html-components index.html
<apollo-client>
  <apollo-query>
    <script type="application/graphql" src="Users.query.graphql"></script>
    <template>
      <h2>Add a New User</h2>
      <apollo-mutation refetch-queries="Users" await-refetch-queries>
        <script type="application/graphql" src="AddUser.mutation.graphql"></script>
        <mwc-textfield label="Name"
                       slot="name"
                       data-variable="name"
                       .disabled="{%raw%}{{ loading }}{%endraw%}"></mwc-textfield>
        <mwc-button label="Submit"
                    trigger
                    slot="name"
                    .disabled="{%raw%}{{ loading }}{%endraw%}"></mwc-button>
        <template>
          <form>
            <slot name="name"></slot>
            <mwc-linear-progress indeterminate .closed="{%raw%}{{ !loading }}{%endraw%}"></mwc-linear-progress>
            <slot name="submit"></slot>
          </form>
        </template>
      </apollo-mutation>
      <h2>All Users</h2>
      <mwc-list>
        <template type="repeat" repeat="{%raw%}{{ data.users ?? [] }}{%endraw%}">
          <mwc-list-item noninteractive graphic="avatar">
            <img .src="{%raw%}{{ item.picture }}{%endraw%}" slot="graphic" alt=""/>
            {%raw%}{{ item.name }}{%endraw%}
          </mwc-list-item>
        </template>
      </mwc-list>
    </template>
  </apollo-query>
</apollo-client>
<script type="module" src="components.js"></script>
```

There's a tonne of potential here and we're very keen to see what you come up with using these new components. Bear in mind that the stampino API isn't stable yet: there may be changes coming down the pipe in the future, but we'll do our best to keep those changes private.

## New and Improved Docs
It wouldn't be an Apollo Elements release without some docs goodies. This time, in addition to new and update docs and guides for components and controllers, we've replaced our webcomponents.dev iframes with `<playground-ide>` elements. All the "Edit Live" demos on this site, including the ones in this blog post, are running locally in your browser via a service worker. Talk about serverless, _amirite_?

The docs also got a major upgrade care of Pascal Schilp's untiring work in the [Webcomponents Community Group](https://www.w3.org/community/webcomponents/) to get the custom elements manifest v1 published. This latest iteration of the API docs generates package manifests directly from source code, and converts them to API docs via [Rocket](https://rocket.modern-web.dev).

## Behind the Scenes

Bringing this release into the light involved more than just refactoring and updating the `apollo-elements/apollo-elements` repo. It represents work across many projects, including PRs to

- [Stampino](https://github.com/justinfagnani/stampino/pulls?q=is%3Apr+is%3Aclosed+merged%3A%3C2021-06-01+merged%3A%3E2021-01+) and [jexpr](https://github.com/justinfagnani/jexpr/pulls?q=is%3Apr+is%3Aclosed+merged%3A%3E2021-01), to iron out bugs, decrease bundle size, and add features
- [Hybrids](https://github.com/hybridsjs/hybrids/pull/167), to add support for reactive controllers
- [Haunted](https://github.com/matthewp/haunted/pull/239), to add the `useController` hook that `@apollo-elements/haunted` is based on

Additionally, here in apollo-elements, we added the [`ControllerHostMixin`](/api/libraries/mixins/controller-host-mixin/) as a way to maintain the previous element-per-graphql-document API without breaking backwards (too much). You can use this generic mixin to add controller support to any web component.

## Fixes and Enhancements

The last release included support for the web components hooks library [haunted](https://github.com/matthewp/haunted), but that support hid a dirty little secret within. Any time you called a hook inside a Haunted function component, apollo elements would sneakily mix the GraphQL interface onto the custom element's prototype. It was a good hack as long as you only call one hook per component, but would break down as soon as you compose multiple operations.

With controllers at the core, and the [`useController`](https://github.com/matthewp/haunted#usecontroller) hook, you can use as many Apollo hooks as you want in your elements without clobbering each other or polluting the element interface.

```js playground haunted-multiple-hooks healthy-snack.js
import { useQuery, html, component } from '@apollo-elements/haunted';
import { client } from './client.js';
import { FruitsQuery } from './Fruits.query.graphql.js';
import { VeggiesQuery } from './Veggies.query.graphql.js';

customElements.define('healthy-snack', component(function HealthySnack() {
  const { data: fruits } = useQuery(FruitsQuery, { client });
  const { data: veggies } = useQuery(VeggiesQuery, { client });
  const snack = [ ...fruits?.fruits ?? [], ...veggies?.veggies ?? [] ];
  return html`
    <link rel="stylesheet" href="healthy-snack.css"/>
    <ul>${snack.map(x => html`<li>${x}</li>`)}</ul>
  `;
}));
```

The same is true of the [hybrids](https://hybrids.js.org) support, it now uses the controllers underneath the hood, letting you mix multiple operations in a single hybrid.

```js playground hybrids-multiple-factories healthy-snack.js
import { query, html, define } from '@apollo-elements/hybrids';
import { client } from './client.js';
import { FruitsQuery } from './Fruits.query.graphql.js';
import { VeggiesQuery } from './Veggies.query.graphql.js';

define('healthy-snack', {
  fruits: query(FruitsQuery, { client }),
  veggies: query(VeggiesQuery, { client }),
  render(host) {
    const snack = [ ...host.fruits.data?.fruits ?? [], ...host.veggies.data?.veggies ?? [] ];
    return html`
      <link rel="stylesheet" href="healthy-snack.css"/>
      <ul>${snack.map(x => html`<li>${x}</li>`)}</ul>
    `;
  }
});
```

## Try it Out

Apollo Elements next is available in prerelease on [npm](https://npm.im/@apollo-elements/core@next). We hope you enjoy using it and look forward to seeing what you come up with.

> Are you using Apollo Elements at work? Consider [sponsoring the project via Open Collective](https://opencollective.com/apollo-elements) to receive perks like priority support.

<style data-helmet>
.markdown-body svg:first-of-type {
  fill: var(--markdown-syntax-color);
}
</style>


```js playground-file multiple-controllers Users.css.js
import { css } from 'lit';
export const style = css`{% include ./multiple-controllers/Users.css | safe %}`;
```

```html playground-file multiple-controllers index.html
<script type="module" src="Users.js"></script>
<users-view></users-view>
```

```css playground-file multiple-controllers style.css
html, body {
  font-family: 'Open Sans', sans-serif;
}
```

```ts playground-file multiple-controllers graphql.documents.ts
{% include ./multiple-controllers/graphql.documents.ts | safe %}
```

```graphql playground-file html-components Users.query.graphql
{% include ./html-components/Users.query.graphql | safe %}
```

```graphql playground-file html-components AddUser.mutation.graphql
{% include ./html-components/AddUser.mutation.graphql | safe %}
```

```js playground-file html-components components.js
{% include ./html-components/components.js | safe %}
```

```html playground-file haunted-multiple-hooks index.html
{% include ./healthy-snack/index.html | safe %}
```

```html playground-file hybrids-multiple-factories index.html
{% include ./healthy-snack/index.html | safe %}
```

```css playground-file haunted-multiple-hooks healthy-snack.css
{% include ./healthy-snack/healthy-snack.css | safe %}
```

```css playground-file hybrids-multiple-factories healthy-snack.css
{% include ./healthy-snack/healthy-snack.css | safe %}
```

```js playground-file haunted-multiple-hooks Fruits.query.graphql.js
import { gql } from '@apollo/client/core';
export const FruitsQuery = gql`{% include ./healthy-snack/Fruits.query.graphql | safe %}`;
```

```js playground-file haunted-multiple-hooks Veggies.query.graphql.js
import { gql } from '@apollo/client/core';
export const VeggiesQuery = gql`{% include ./healthy-snack/Veggies.query.graphql %}`;
```

```js playground-file hybrids-multiple-factories Fruits.query.graphql.js
import { gql } from '@apollo/client/core';
export const FruitsQuery = gql`{% include ./healthy-snack/Fruits.query.graphql | safe %}`;
```

```js playground-file hybrids-multiple-factories Veggies.query.graphql.js
import { gql } from '@apollo/client/core';
export const VeggiesQuery = gql`{% include ./healthy-snack/Veggies.query.graphql %}`;
```

```js playground-file haunted-multiple-hooks client.js
{% include ./healthy-snack/client.js | safe %}
```

```js playground-file hybrids-multiple-factories client.js
{% include ./healthy-snack/client.js | safe %}
```

<style data-helmet>
#hybrids-multiple-factories,
#haunted-multiple-hooks {
  --playground-ide-height: 320px;
}
</style>