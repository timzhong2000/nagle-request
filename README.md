# Nagle Request

Nagle Request is a library for arranging a huge amount of requests in one request.

## Overview

This project is inspired by [Nagle Algorithm](https://en.wikipedia.org/wiki/Nagle%27s_algorithm). When a huge amount of coroutine request the same api, the extra overhead can be avoided by arranging them in one request.

## Features

- **Batch Size Limit** - A request will be send immediately when the queue length reach the limit.

- **Pluggable Cache** - You can plugin any cache to provide flexable cache. You can also plugin JavaScript Map, and it can work fine.

## Getting Started

Get student score in many coroutine but only create one http request.

```ts
const studentScore = new NagleRequest<string, number>({
  debounce: 50,
  maxRequestCount: 1000,
  batchRequestFn: async (batch: string[]) => {
    /** make a http request and return result*/
  },
  cacheFactory: Map,
});

// coroutine 1
await studentScore.request("stu_7mZTcjAO");

// coroutine 2
await studentScore.request("stu_oNAYIOH1");

// ... a lot of coroutine
```

## License

Nagle Request is Apache 2.0 licensed.
