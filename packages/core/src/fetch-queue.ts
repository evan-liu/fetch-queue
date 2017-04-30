export interface IFetchQueueOptions {
  readonly maxConnections?: number;
  readonly baseURL?: string;
}

export class FetchQueue {

  public readonly options: IFetchQueueOptions;

  public constructor(options?: IFetchQueueOptions) {
    this.options = {
      maxConnections: 4,
      ...options,
    };
  }

}
