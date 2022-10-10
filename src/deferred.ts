export class Deferred<T> {
  reject!: (reason: any) => void;
  resolve!: (value: T | PromiseLike<T>) => void;
  promise: Promise<T> = new Promise<T>((resolve, reject) => {
    this.resolve = resolve;
    this.reject = reject;
  });
}
