import {FetchQueue} from "./fetch-queue";

describe("constructor", () => {

  it("read options", () => {
    expect(new FetchQueue().options.maxConnections).toBe(4);
    expect(new FetchQueue({maxConnections: 3}).options.maxConnections).toBe(3);

    expect(new FetchQueue().options.baseURL).toBeUndefined();
    expect(new FetchQueue({baseURL: "/tests"}).options.baseURL).toBe("/tests");
  });

});
