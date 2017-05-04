import * as fetchMock from "fetch-mock";
import {FetchQueue} from "./fetch-queue";

beforeEach(() => {
  fetchMock.mock(/.*test.*/, 200);
});
afterEach(() => {
  fetchMock.reset();
});

test("read options", () => {
  expect(new FetchQueue().options.maxConnections).toBe(4);
  expect(new FetchQueue({maxConnections: 3}).options.maxConnections).toBe(3);

  expect(new FetchQueue().options.baseURL).toBeUndefined();
  expect(new FetchQueue({baseURL: "api"}).options.baseURL).toBe("api");
});

test("pending for maxConnections", (done) => {
  expect.assertions(4);

  const queue = new FetchQueue({maxConnections: 2});

  queue.add("test/1");
  queue.add("test/2");
  queue.add("test/3");
  queue.add("test/4").then(() => {
    expect(queue.activeCount).toBe(0);
    expect(queue.pendingCount).toBe(0);
    done();
  });

  expect(queue.activeCount).toBe(2);
  expect(queue.pendingCount).toBe(2);
});

test("add base url to path", () => {
  new FetchQueue().add("/tests");
  new FetchQueue({baseURL: "api"}).add("/tests");

  expect(fetchMock.calls().matched.map((i) => i[0])).toEqual([
    "/tests",
    "api/tests",
  ]);

});

test("cancel requests", (done) => {
  const queue = new FetchQueue({maxConnections: 2});
  expect.assertions(7);

  fetchMock.once("x/3", {throws: 400});

  const p1 = queue.add("test/1");
  const p2 = queue.add("test/2");
  const p3 = queue.add("x/3");
  const p4 = queue.add("test/4");

  const failMock1 = jest.fn();
  const failMock2 = jest.fn();
  const failMock4 = jest.fn();
  p1.catch(failMock1);
  p2.catch(failMock2);
  p4.catch(failMock4);

  p2.cancel();
  p4.cancel();

  expect(queue.pendingCount).toBe(1); // Remove pending request right away
  expect(queue.activeCount).toBe(2); // Wait for active connection

  p1.then(() => {
    p1.cancel(); // Should do nothing when cancel a finished request
  });

  p3.catch(() => {
    expect(failMock1).not.toHaveBeenCalled();
    expect(failMock2).toHaveBeenCalled();
    expect(failMock4).toHaveBeenCalled();
    expect(queue.activeCount).toBe(0);
    expect(queue.pendingCount).toBe(0);
    done();
  });
});
