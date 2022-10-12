export interface ICache<K, V> {
  get: (key: K) => V | undefined;
  set: (key: K, value: V) => void;
  size: number;
}
export type BatchRequestHandler<K, V> = (keys: K[]) => Promise<V[]>;

export interface Config<K, V> {
  /**
   * every request will trigger a debounce request.
   */
  debounce: number;
  /**
   * if the request queue length reach maxRequestCount.
   *
   * it will send a request immediately even if request is in debounce queue.
   */
  maxRequestCount: number;
  /**
   * request handler.
   *
   * the input is a sorted array of request body.
   *
   * the output should be an array has same order as the input array
   */
  batchRequestFn: BatchRequestHandler<K, V>;
  /**
   * if cacheFactory is undefined, the request will not be cached
   */
  cacheFactory?: new () => ICache<K, V>;
}
