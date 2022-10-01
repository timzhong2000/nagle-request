import { ICache, Config, OnError, OnSuccess, QueueItem } from "./types";
import { debounce, DebouncedFunc } from "lodash-es";

export class NagleRequest<K, V> {
  private readonly cache?: ICache<K, V>;
  private readonly queue: Map<K, QueueItem<V>> = new Map<K, QueueItem<V>>();
  private readonly debounceRun: DebouncedFunc<typeof this.runImmediate>;

  constructor(private config: Config<K, V>) {
    config.cacheFactory && (this.cache = new config.cacheFactory());
    this.debounceRun = debounce(() => this.runImmediate(), config.debounce);
  }

  request(key: K): Promise<V> {
    return new Promise<V>((resolve, reject) => {
      this.enqueue(key, resolve, reject);
    });
  }

  requestWithCallback(key: K, onSuccess: OnSuccess<V>, onError: OnError): void {
    this.enqueue(key, onSuccess, onError);
  }

  private enqueue(key: K, onSuccess: OnSuccess<V>, onError: OnError): void {
    // cache begin
    const cacheResult = this.cache?.get(key);
    if (cacheResult) return onSuccess(cacheResult);
    // cache end

    // init queue item ref start
    let queueItemRef: QueueItem<V> | undefined = this.queue.get(key);
    if (queueItemRef === undefined) {
      queueItemRef = { onSuccessList: [], onErrorList: [] };
      this.queue.set(key, queueItemRef);
    }
    // init queue item ref end

    // add to queue start
    queueItemRef.onSuccessList.push(onSuccess);
    queueItemRef.onErrorList.push(onError);
    // add to queue end

    // trigger run start
    if (this.queue.size === this.config.maxRequestCount) {
      this.runImmediate();
    } else {
      this.debounceRun();
    }
    // trigger run end
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
        list[index][1].onSuccessList.forEach((onSuccess) => onSuccess(value));
      });
    } catch (err) {
      list.forEach((arr) =>
        arr[1].onErrorList.forEach((onError) => onError(err as Error))
      );
    }
  }
}
