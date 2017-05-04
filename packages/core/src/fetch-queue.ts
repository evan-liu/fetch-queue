/** Options for the fetch queue and all fetch requests. */
export interface IFetchQueueOptions {

  /** Max live connection count of the queue. Default to 4. */
  readonly maxConnections?: number;

  /** Base url for server endpoint paths. */
  readonly baseURL?: string;

}

/** Promise that can cancel the request.  */
export interface IFetchQueuePromise<T = any> extends Promise<T> {

  /** Cancel the request and remove it from the queue. */
  cancel(): void;

}

enum ItemState {
  Pending,
  Active,
  Succeeded,
  Failed,
  Canceled,
}

interface IQueueItem {
  readonly url: string;
  readonly init?: RequestInit;
  readonly resolve: (value: Response) => void;
  readonly reject: (reason?: any) => void;
  state: ItemState;
}

/**
 * Request queue base on fetch() API.
 */
export class FetchQueue {

  /** Fetch queue options. */
  public readonly options: IFetchQueueOptions;

  /** Count of requests pending in the queue. */
  public get pendingCount(): number {
    return this.pendingItems.length;
  }

  /** Count of active request sending out. */
  public get activeCount(): number {
    return this.activeItems.length;
  }

  private pendingItems: IQueueItem[] = [];
  private activeItems: IQueueItem[] = [];

  /**
   * Create a fetch queue.
   * @param options Queue options.
   */
  public constructor(options?: IFetchQueueOptions) {
    this.options = {
      maxConnections: 4,
      ...options,
    };
  }

  /**
   * Add a request to the end of the queue.
   *
   * @param url Request url or path (requires `baseURL` in options)
   * @param init Request init for fetch() API
   * @returns {IFetchQueuePromise} Request promise that can also cancel the request.
   */
  public add(url: string, init?: RequestInit): IFetchQueuePromise<Response> {
    if (this.options.baseURL && url[0] === "/") {
      url = this.options.baseURL + url;
    }

    let item: IQueueItem;
    const promise = new Promise((resolve, reject) => {
      item = {url, init, resolve, reject, state: ItemState.Pending};
      this.pendingItems.push(item);
    }) as IFetchQueuePromise;
    promise.cancel = () => this.cancel(item);

    this.checkNext();

    return promise;
  }

  private cancel(item: IQueueItem) {
    switch (item.state) {
      case ItemState.Pending:
        this.pendingItems = this.pendingItems.filter((i) => i !== item);
        break;
      case ItemState.Active:
        // It is sending out. Cannot really cancel the request. Just ignore the response.
        break;
      default:
        // Do noting if it is already finished/canceled
        return;
    }
    item.state = ItemState.Canceled;
    item.reject("Canceled");
  }

  private checkNext() {
    while (this.pendingCount > 0 && this.activeCount < this.options.maxConnections!) {
      const item = this.pendingItems.shift()!;
      this.activeItems.push(item);
      item.state = ItemState.Active;
      fetch(item.url, item.init).then(
        (response) => this.handleResult(item, ItemState.Succeeded, response),
        (reason) => this.handleResult(item, ItemState.Failed, reason),
      );
    }
  }

  private handleResult(item: IQueueItem, state: ItemState, result: any) {
    this.activeItems = this.activeItems.filter((i) => i !== item);

    if (item.state === ItemState.Active) {
      item.state = state;
      if (state === ItemState.Succeeded) {
        item.resolve(result);
      } else {
        item.reject(result);
      }
    }

    this.checkNext();
  }

}
