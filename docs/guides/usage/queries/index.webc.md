---
title: Queries
permalink: /guides/usage/queries/index.html
eleventyNavigation:
  order: 10
templateEngineOverride: webc,md
description: Use Apollo Elements to write high-performance GraphQL query components
---

Query components combine a <abbr title="graph query language">GraphQL</abbr> 
query with a [custom 
element](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_custom_elements), 
which you would usually define with a <abbr title="document object 
  model">DOM</abbr> template and optionally some custom JavaScript behaviours. 
In other words, each query component 
[encapsulates](https://www.wikiwand.com/en/Encapsulation_(computer_programming)) 
GraphQL *data* (the query) and <abbr title="hypertext markup 
  language">HTML</abbr>/<abbr title="cascading style sheets">CSS</abbr>/<abbr 
  title="javascript">JS</abbr> <abbr title="user interface">UI</abbr> (the 
custom element).

<inline-notification>

This page is a HOW-TO guide. For detailed docs on the `ApolloQuery` interface 
see the [API docs](/api/core/interfaces/query/)

</inline-notification>

Queries are how your application reads data from the graph. You can think of 
them as roughly analogous to <abbr title="hypertext transfer 
  protocol">HTTP</abbr> [`GET` 
requests](https://www.wikiwand.com/en/Hypertext_Transfer_Protocol#/Request_methods) 
or <abbr title="structured query 
  language">[SQL](https://www.wikiwand.com/en/SQL)</abbr> `READ` statements. A 
query can have variables, e.g. "user, by user ID" or "posts, sorted by last 
modified"; or it might not, e.g. "all users".

By default, query components *automatically* fetch their data over the network 
once they are added to the page, although you can [configure the fetching 
behaviour](#configuring-fetching) in a handful of different ways. Once a query 
components starts fetching its data, it *subscribes* to all future updates; so 
conceptually, think of your component as rendering a DOM template using the 
latest, up-to-date result of its query.

> TL;DR: query components read data from the graph. By default, query elements 
> automatically fetch data once you set their `query` and/or `variables` 
> properties or class fields. Render your component's local DOM with the 
> component's `data`, `loading`, and `error` properties.

Query components read data from the GraphQL and expose them on the element's 
`data` property. Each query element has a `query` property which is a GraphQL 
`DocumentNode`. You can create that object using the `gql` template literal tag, 
or via `@rollup/plugin-graphql`, etc. See the [buildless 
development](/guides/getting-started/buildless-development/) guide for more 
info.

```graphql copy
query HelloQuery {
  hello { name greeting }
}
```

Apollo Elements give you three ways to define query components:
1. Using the `<apollo-query>` HTML element
2. With [`ApolloQueryController`](/api/core/controllers/query/) reactive 
controller; `useQuery` hook for [haunted](/api/libraries/haunted/useQuery/) or 
[atomico](/api/libraries/atomico/useQuery/); or `query` [hybrids 
factory](/api/libraries/hybrids/query/)
3. By defining a custom element that extends from {%footnoteref "querymixin", 
'or applies <a 
  href="/api/libraries/mixins/apollo-query-mixin/"><code>ApolloQueryMixin</code></a>'%}{%endfootnoteref%}

## HTML Queries

The `<apollo-query>` element from `@apollo-elements/components` lets you 
declaratively create query components using HTML. It renders its template to its 
shadow root, so you get all the benefits of [Shadow DOM 
encapsulation](https://developer.mozilla.org/en-US/docs/Web/Web_Components/Using_shadow_DOM) 
(you can opt out of Shadow DOM by setting the `no-shadow` attribute). If your 
query's variables are static, adding a <abbr title="JavaScript Object 
  Notation">JSON</abbr> script as a child of the element to initialize them and 
start the query.

<code-copy>

  ```html
  <apollo-query webc:raw>
    <script type="application/graphql">
      query HelloQuery($name: String, $greeting: String) {
        helloWorld(name: $name, greeting: $greeting) {
          name
          greeting
        }
      }
    </script>

    <script type="application/json">
      {
        "greeting": "How's it going",
        "name": "Dude"
      }
    </script>

    <template>
      <style>
        #greeting { font-weight: bold; }
        #name { font-style: italic; }
      </style>
      <span id="greeting">{{ data.helloWorld.greeting }}</span>,
      <span id="greeting">{{ data.helloWorld.name }}</span>,
    </template>
  </apollo-query>
  ```

</code-copy>

Read more about `<apollo-query>` in the [`<apollo-query>` HTML element guide](/guides/usage/queries/html/).

<!--- ## TODO: query controller  --->

## Custom Query Elements

<!--- maintain links to the old heading --->
<a id="query-elements"></a>

Apollo Elements gives you multiple options for defining your own custom query 
elements. Which option you choose depends on your application, your team, and 
your priorities. You can extend from the 
[lit](/api/libraries/lit-apollo/apollo-query/) or 
[FAST](/api/libraries/fast/apollo-query/) base classes, or apply the [Apollo 
query mixin](/api/libraries/mixins/apollo-query-mixin/) to the base class of 
your choice. For those who prefer a more 'functional' approach, there's the 
[`useQuery` haunted hook](/api/libraries/haunted/useQuery/) or the [`query` 
hybrids factory](/api/libraries/hybrids/query/).

In any case, setting your element's query property or class field (or using 
`useQuery` or `query` factory) will automatically start the subscription. You 
can change the query via the `query` DOM property at any time to reinitialize 
the subscription.

<code-copy>

```js
document.querySelector('hello-query').query = HelloQuery;
```

</code-copy>

Apollo client ensures that the component always has the latest data by {% 
footnoteref "observablequery", "This is different from <a 
  href='/guides/usage/subscriptions/'>GraphQL subscriptions</a>, which are 
realtime persistent streams, typically over websockets. Rather, 
<code>ObservableQueries</code> update the client-side state whenever the query's 
data changes, either because the user executed the query operation, a mutation 
updated the query's fields, or the Apollo cache's local state changed." 
%}_subscribing_{% endfootnoteref %} to the query using an 
[`ObservableQuery`](https://www.apollographql.com/docs/react/api/core/ObservableQuery/) 
object. As long as an element has access to an `ApolloClient` instance, whenever 
its `query` or `variables` property changes, it will automatically subscribe to 
(or update) its `ObservableQuery`.

When the `ObservableQuery` subscription produces new data (e.g. on response from 
the GraphQL server, or if local state changes), it sets the element's `data`, 
`loading` and `error` properties (as well as `errors` if `returnPartialData` 
property is true). The following example shows how a simple query element 
written with different component libraries (or none) renders it's state.

<code-tabs collection="libraries" default-tab="lit">
  <code-tab tab-id="html" src="snippets/rendering/html.html"></code-tab>
  <code-tab tab-id="mixins" src="snippets/rendering/mixins.ts"></code-tab>
  <code-tab tab-id="lit" src="snippets/rendering/lit.ts"></code-tab>
  <code-tab tab-id="fast" src="snippets/rendering/fast.ts"></code-tab>
  <code-tab tab-id="haunted" src="snippets/rendering/haunted.js"></code-tab>
  <code-tab tab-id="atomico" src="snippets/rendering/atomico.jsx"></code-tab>
  <code-tab tab-id="hybrids" src="snippets/rendering/hybrids.js"></code-tab>
</code-tabs>

## Query Variables

Some queries have variables, which you can use to customize the response from the GraphQL server:

<code-copy>

```graphql
query HelloQuery($name: String, $greeting: String) {
  helloWorld(name: $name, greeting: $greeting) {
    name
    greeting
  }
}
```

</code-copy>

To apply variables to your query element, set its [`variables` 
property](/api/core/interfaces/query/#variables). For the above example, which 
has two string parameters, `name` and `greeting`, set your element's `variables` 
property to an object with keys `name` and `greeting` and values representing 
the query arguments:

<code-copy>

```js
root.querySelector('hello-query').variables = {
  greeting: "How's it going",
  name: 'Dude'
};
```

</code-copy>

For class-based components (e.g. vanilla, `lit-apollo`, or `FAST`), you can 
apply arguments by setting the `variables` class field, while the 
[`ApolloQueryController`](/api/core/controllers/query/), [`useQuery` haunted 
hook](/api/libraries/haunted/useQuery/) and [`query` hybrids 
factory](/api/libraries/hybrids/query/) take a second options parameter with a 
`variables` property.

<code-tabs collection="libraries" default-tab="lit">
  <code-tab tab-id="html" src="snippets/variables/html.html"></code-tab>
  <code-tab tab-id="mixins" src="snippets/variables/mixins.ts"></code-tab>
  <code-tab tab-id="lit" src="snippets/variables/lit.ts"></code-tab>
  <code-tab tab-id="fast" src="snippets/variables/fast.ts"></code-tab>
  <code-tab tab-id="haunted" src="snippets/variables/haunted.js"></code-tab>
  <code-tab tab-id="atomico" src="snippets/variables/atomico.jsx"></code-tab>
  <code-tab tab-id="hybrids" src="snippets/variables/hybrids.js"></code-tab>
</code-tabs>

Variables can be non-nullable i.e. required. To prevent your element from fetching until it has all it's required variables, see [validating variables](/guides/cool-tricks/validating-variables/).

## Configuring Fetching

There are three main ways to control how and when your query component fetches its data:

1. By setting the `no-auto-subscribe` attribute
2. By overriding the `shouldSubscribe` method
3. By setting a custom `FetchPolicy`

You can call your component's 
[`executeQuery()`](/api/core/interfaces/query/#executequery) method at any time 
to {%footnoteref 'executeQuery', "if you've previously set a 'cache-only' fetch 
policy and you want to imperatively issue query over the network, call 
<code>executeQuery({ fetchPolicy: 'network-only' 
    })</code>"%}immediately{%endfootnoteref%} fetch the query.

### No Auto Subscribe

<!-- maintain links to the old heading -->
<a id="preventing-automatic-subscription"></a>

If you want to keep your element from automatically subscribing, you can opt out 
of the default behaviour by setting the `noAutoSubscribe` DOM property.

<code-tabs collection="libraries" default-tab="lit">
  <code-tab tab-id="html" src="snippets/noAutoSubscribe/html.html"></code-tab>
  <code-tab tab-id="mixins" src="snippets/noAutoSubscribe/mixins.ts"></code-tab>
  <code-tab tab-id="lit" src="snippets/noAutoSubscribe/lit.ts"></code-tab>
  <code-tab tab-id="fast" src="snippets/noAutoSubscribe/fast.ts"></code-tab>
  <code-tab tab-id="haunted" src="snippets/noAutoSubscribe/haunted.js"></code-tab>
  <code-tab tab-id="atomico" src="snippets/noAutoSubscribe/atomico.jsx"></code-tab>
  <code-tab tab-id="hybrids" src="snippets/noAutoSubscribe/hybrids.js"></code-tab>
</code-tabs>

Once you do, the element won't fetch any data unless you call its [`subscribe()`](/api/core/interfaces/query/#subscribe) or [`executeQuery()`](/api/core/interfaces/query/#executequery) methods.

<code-copy>

  ```js
  const element = document.querySelector('hello-query')
  element.subscribe();
  ```

</code-copy>

You can also set the boolean `no-auto-subscribe` attribute to the element instance. Bear in mind that `no-auto-subscribe` is a boolean attribute, so it's presence indicates truthiness, and its absence indicates falsiness.

<code-copy>

  ```html
  <!-- This one subscribes immediately -->
  <hello-query></hello-query>
  <!-- This one will not subscribe until called -->
  <hello-query no-auto-subscribe></hello-query>
  <!-- Neither will this one -->
  <hello-query no-auto-subscribe="false"></hello-query>
  ```

</code-copy>

<inline-notification type="warning">

NOTE, the `no-auto-subscribe` attribute comes built-in for query class elements 
e.g. `@apollo-elements/mixins/apollo-query-mixin.js` for 
[controllers](/api/core/), [hybrids](/api/libraries/hybrids/) components or 
[haunted](/api/libraries/haunted/) `useQuery` hooks, you can pass the 
`noAutoSubscribe` option to the controller, but you'll be in charge of reading 
the attribute yourself.

</inline-notification>

### Overriding `shouldSubscribe`

The query component class' protected 
[`shouldSubscribe`](/api/core/interfaces/query/#shouldsubscribe) method controls 
whether or not to subscribe to updates. The default implementation constantly 
returns `true`. If you wish to customize that behaviour, override the method 
with your own custom predicate, like this example which checks for the presence 
of a query param in the page URL:

<code-tabs collection="libraries" default-tab="lit">
  <code-tab tab-id="html" src="snippets/shouldSubscribe/html.html"></code-tab>
  <code-tab tab-id="mixins" src="snippets/shouldSubscribe/mixins.ts"></code-tab>
  <code-tab tab-id="lit" src="snippets/shouldSubscribe/lit.ts"></code-tab>
  <code-tab tab-id="fast" src="snippets/shouldSubscribe/fast.ts"></code-tab>
  <code-tab tab-id="haunted" src="snippets/shouldSubscribe/haunted.js"></code-tab>
  <code-tab tab-id="atomico" src="snippets/shouldSubscribe/atomico.jsx"></code-tab>
  <code-tab tab-id="hybrids" src="snippets/shouldSubscribe/hybrids.js"></code-tab>
</code-tabs>

### Setting a `FetchPolicy`

[Fetch 
Policies](https://www.apollographql.com/docs/react/data/queries/#setting-a-fetch-policy) 
are how Apollo client internally manages query behaviour. The default fetch 
policy for queries is `cache-first` meaning that Apollo client will first check 
to see if a given operation (i.e. query-variables pair) already has complete 
data in the cache. If so, it will *not* fetch over the network. Set the 
`fetchPolicy` property on your component to configure.

<code-tabs collection="libraries" default-tab="lit">
  <code-tab tab-id="html" src="snippets/fetchPolicy/html.html"></code-tab>
  <code-tab tab-id="mixins" src="snippets/fetchPolicy/mixins.ts"></code-tab>
  <code-tab tab-id="lit" src="snippets/fetchPolicy/lit.ts"></code-tab>
  <code-tab tab-id="fast" src="snippets/fetchPolicy/fast.ts"></code-tab>
  <code-tab tab-id="haunted" src="snippets/fetchPolicy/haunted.js"></code-tab>
  <code-tab tab-id="atomico" src="snippets/fetchPolicy/atomico.jsx"></code-tab>
  <code-tab tab-id="hybrids" src="snippets/fetchPolicy/hybrids.js"></code-tab>
</code-tabs>

You can also use the `fetch-policy` attribute on individual elements (if they 
implement the ApolloElement interface, e.g. `<apollo-query>` or elements with 
`ApolloQueryMixin`):

<code-copy>

  ```html
  <apollo-query fetch-policy="network-only">
    <script type="application/graphql">
    query AlwaysFresh {
      messages(sort: desc) {
        id message
      }
    }
    </script>
    <template>
      <h2>Latest Message:</h2>
      <template type="if" if="{{ data }}">
        <p>{{ data.messages[0].message }}</p>
      </template>
    </template>
  </apollo-query>
  ```

</code-copy>

If you want your query to fire once over the network, but subsequently to only 
use the client-side cache, use the 
[`nextFetchPolicy`](/api/core/interfaces/query/#nextfetchpolicy) property.

If you want your component to automatically subscribe, but only if its required 
variables are present, see [Validating 
Variables](/guides/cool-tricks/validating-variables/).

## Reacting to Updates
As we've seen query elements set their `data` property whenever the query 
resolves. For vanilla components, you should define a data setter that renders 
your DOM, and for each library (`lit`, `FAST`, `hybrids`, etc.), their differing 
reactivity systems ensure that your element renders when the data changes.

If you want to run other side effects, here are some options:

- use your library's reactivity system, e.g. `updated` for Lit
- define [`onData`](/api/core/interfaces/query/lifecycle/#ondata) callback
- listen for the `apollo-query-result` and `apollo-error` 
[events](/api/core/interfaces/query/lifecycle/#events)
- call the [`executeQuery`](/api/core/interfaces/query/#executequery) method and 
`await` it's result.

For more information, see [query element 
lifecycle](/api/core/interfaces/query/lifecycle/)

## Next Steps

Read about the [`<apollo-query>` HTML element](/guides/usage/queries/html/),
dive into the [`ApolloQuery` API](/api/core/interfaces/query/) and [component 
lifecycle](/api/core/interfaces/query/lifecycle/)
or continue on to the [mutations guide](/guides/usage/mutations/).