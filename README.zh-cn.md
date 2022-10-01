[English](./README.md) | 简体中文

# Nagle Request

Nagle Request 一个自动合并请求的库

## 概述

这个项目灵感来自 [Nagle Algorithm](https://en.wikipedia.org/wiki/Nagle%27s_algorithm)。 当很多个协程同时访问相同 api 时，会有不必要的性能开销。如果把很多请求聚合成一个请求，可以避免这些开销提升性能。

## 功能

- **Batch 大小限制** - 如果请求队列达到 Batch 大小限制，会立刻将队列的请求聚合成一个请求发送出去。

- **缓存插件（可选）** - 你可以更换缓存插件提供更灵活的缓存控制。你也可以简单地传入 JavaScript 的 Map，也能跑得起来。你还可以传入 undefined 来禁用缓存。

## 快速上手

在多个独立的协程上请求学生的成绩，并且多次读取学生成绩的请求会被聚合成一个 http 请求。

```ts
const studentScore = new NagleRequest<string, number>({
  debounce: 50,
  maxRequestCount: 1000,
  batchRequestFn: async (batch: string[]) => {
    /** 发送 http 请求*/
  },
  cacheFactory: Map,
});

// coroutine 1
await studentScore.request("stu_7mZTcjAO");

// coroutine 2
await studentScore.request("stu_oNAYIOH1");

// ... 大量协程
```

## License

Nagle Request is Apache 2.0 licensed.
