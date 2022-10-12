import { ICache, Config } from "./types";
import { debounce, DebouncedFunc } from "lodash-es";
import { Deferred } from "./deferred";

export class NagleRequest<K, V> {
  private readonly cache?: ICache<K, V>;
  private readonly queue: Map<K, Deferred<V>> = new Map<K, Deferred<V>>();
  private readonly debounceRun: DebouncedFunc<typeof this.runImmediate>;

  constructor(private config: Config<K, V>) {
    config.cacheFactory && (this.cache = new config.cacheFactory());
    this.debounceRun = debounce(() => this.runImmediate(), config.debounce);
  }

  request(key: K): Promise<V> {
    // cache begin
    const cacheResult = this.cache?.get(key);
    if (cacheResult) return Promise.resolve(cacheResult);
    // cache end

    // init deferred start
    let deferred: Deferred<V> | undefined = this.queue.get(key);
    if (deferred === undefined) {
      deferred = new Deferred();
      this.queue.set(key, deferred);
    }
    // init queue item ref end

    // trigger run start
    if (this.queue.size === this.config.maxRequestCount) {
      this.runImmediate();
    } else {
      this.debounceRun();
    }
    // trigger run end

    return deferred.promise;
  }

  private async runImmediate(): Promise<void> {
    this.debounceRun.cancel(); // avoid outdate trigger
    const list = Array.from(this.queue.entries());
    this.queue.clear();
    try {
      const batchResult = await this.config.batchRequestFn(
        list.map((arr) => arr[0])
      );
      batchResult.forEach((value, index) => {
        this.cache && this.cache.set(list[index][0], value);
        list[index][1].resolve(value);
      });
    } catch (err) {
      list.forEach((arr) => arr[1].reject(err));
    }
  }
}
