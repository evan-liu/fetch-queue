# fetch-queue

[![Build Status](https://travis-ci.org/evan-liu/fetch-queue.svg?branch=master)](https://travis-ci.org/evan-liu/fetch-queue)
[![Code Coverage](https://codecov.io/gh/evan-liu/fetch-queue/branch/master/graph/badge.svg)](https://codecov.io/gh/evan-liu/fetch-queue)

A http request queue based on `fetch()` API. 

## Why

REST APIs often require a lot of http requests to fetch data for complicated clients like mobile apps or single page web applications, which lead to bad user experiences, especially with HTTP 1.1 [max connections per hostname](http://www.browserscope.org/?category=network) limitation. [GraphQL](http://graphql.org) is Facebook's answer to this problem (and others), while `fetch-queue` is trying to help those stuck with REST API servers.
    
## How

For example, you can create one fetch queue for user action and one for data prefetch. 

```javascript
import { FetchQueue } from "@fetch-queue/core";

const actionQueue = new FetchQueue({maxConnections: 2});
const prefetchQueue = new FetchQueue({maxConnections: 2});

actionQueue.add("https://api.server.com/users/123").then((response) => {
  // Go to profile page for tapped user  
});

prefetchQueue.add("https://api.server.com/notifications").then((response) => {
  // Save notifications to model so user can read it later without waiting
});
```

Or you can have a separate hostname for prefetch. 

```javascript
const prefetchQueue = new FetchQueue({baseURL: "https://prefetch.server.com"}); // maxConnections is 4 by default

prefetchQueue.add("/notifications").then(/**/);
prefetchQueue.add("/friends").then(/**/);

```

## Install
 
**Note**: Polyfill for [fetch](https://github.com/github/fetch) or [promise](https://github.com/taylorhakes/promise-polyfill) not included. 

```sh
npm install --save @fetch-queue/core
```
