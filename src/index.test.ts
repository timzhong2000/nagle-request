import { expect, test } from "vitest";
import { NagleRequest } from "./index";

test("batch request created in debounce time", async () => {
  let count = 0;
  let batchLength: number[] = [];
  const nagleRequest = new NagleRequest({
    debounce: 50,
    maxRequestCount: 1000,
    batchRequestFn: (value: number[]) => {
      batchLength.push(value.length);
      count++;
      return new Promise<number[]>((r) =>
        setTimeout(() => r(value.map((num) => num + 1)), 10)
      );
    },
  });

  for (let i = 0; i < 700; i++) {
    nagleRequest.request(i);
  }

  new Promise<void>((r) =>
    setTimeout(() => {
      nagleRequest.request(9999);
      r();
    }, 30)
  );

  await nagleRequest.request(10000);

  expect(count).toBe(1);
  expect(batchLength).toStrictEqual([702]);
});

test("split request if debounce time reach", async () => {
  let count = 0;
  let batchLength: number[] = [];
  const nagleRequest = new NagleRequest({
    debounce: 50,
    maxRequestCount: 1000,
    batchRequestFn: (value: number[]) => {
      batchLength.push(value.length);
      count++;
      return new Promise<number[]>((r) =>
        setTimeout(() => r(value.map((num) => num + 1)), 10)
      );
    },
  });

  for (let i = 0; i < 700; i++) {
    nagleRequest.request(i);
  }

  // sleep 500ms
  await new Promise<void>((r) => setTimeout(() => r(), 100));

  // request once
  await nagleRequest.request(10000);

  expect(count, "splited into 2 requests").toBe(2);
  expect(
    batchLength,
    "first request length: 700, second request length: 1"
  ).toStrictEqual([700, 1]);
});

test("unique request key", async () => {
  let count = 0;
  let batchLength: number[] = [];
  const nagleRequest = new NagleRequest({
    debounce: 50,
    maxRequestCount: 1000,
    batchRequestFn: (value: number[]) => {
      batchLength.push(value.length);
      count++;
      return new Promise<number[]>((r) =>
        setTimeout(() => r(value.map((num) => num + 1)), 10)
      );
    },
    cacheFactory: Map,
  });

  for (let i = 0; i < 700; i++) {
    nagleRequest.request(10);
  }

  const res = await nagleRequest.request(10000);
  expect(count, "create only 1 request").toBe(1);
  expect(batchLength, "request length: 2").toStrictEqual([2]);
  expect(res).toBe(10001);
});

test("return result immediately if hit cache", async () => {
  let count = 0;
  let batchLength: number[] = [];
  const nagleRequest = new NagleRequest({
    debounce: 50,
    maxRequestCount: 1000,
    batchRequestFn: (value: number[]) => {
      batchLength.push(value.length);
      count++;
      return new Promise<number[]>((r) =>
        setTimeout(() => r(value.map((num) => num + 1)), 10)
      );
    },
    cacheFactory: Map,
  });

  expect(await nagleRequest.request(100)).toBe(101);
  expect(count, "create only 1 request").toBe(1);

  expect(await nagleRequest.request(100)).toBe(101);
  expect(
    count,
    "create only 1 request with length 1, the second request should hit cache"
  ).toBe(1);
});

test("request when cache is miss", async () => {
  let map: Map<number, number> = undefined as unknown as Map<number, number>; // 可以保证初始化batchRequest时，map被赋值
  class MyMap extends Map<number, number> {
    constructor() {
      super();
      map = this;
    }
  }
  let count = 0;
  let batchLength: number[] = [];
  const nagleRequest = new NagleRequest({
    debounce: 50,
    maxRequestCount: 1000,
    batchRequestFn: (value: number[]) => {
      batchLength.push(value.length);
      count++;
      return new Promise<number[]>((r) =>
        setTimeout(() => r(value.map((num) => num + 1)), 10)
      );
    },
    cacheFactory: MyMap,
  });

  expect(
    await Promise.all([
      nagleRequest.request(100),
      nagleRequest.request(100),
      nagleRequest.request(200),
      nagleRequest.request(300),
    ])
  ).toStrictEqual([101, 101, 201, 301]);
  expect(count, "create only 1 request").toBe(1);
  expect(batchLength, "request size should be 3").toStrictEqual([3]);
  map.delete(100);
  expect(await nagleRequest.request(100)).toBe(101);
  expect(count, "create 2nd request").toBe(2);
  expect(batchLength, "request size should be 1").toStrictEqual([3, 1]);
});

test("maxRequestCount test", async () => {
  let count = 0;
  let batchLength: number[] = [];
  const nagleRequest = new NagleRequest({
    debounce: 50,
    maxRequestCount: 1000,
    batchRequestFn: (value: number[]) => {
      batchLength.push(value.length);
      count++;
      return new Promise<number[]>((r) =>
        setTimeout(() => r(value.map((num) => num + 1)), 10)
      );
    },
    cacheFactory: Map,
  });

  const testList = new Array(2000).fill(0).map(() => Math.random());
  expect(
    await Promise.all(
      testList.map((testcase) => nagleRequest.request(testcase))
    ),
    "result should be correct"
  ).toStrictEqual(testList.map((testcase) => testcase + 1));
  expect(count, "create 2 requests").toBe(2);
  expect(
    batchLength,
    "each request size should be maxRequestCount"
  ).toStrictEqual([1000, 1000]);
});
