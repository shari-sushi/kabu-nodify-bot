import { retryWithBackoff, type RetryOptions } from "./retry";

describe("retryWithBackoff", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return result on first success", async () => {
    const fn = jest.fn().mockResolvedValue("success");
    const result = await retryWithBackoff(fn);
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure and eventually succeed", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");

    const result = await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 });
    expect(result).toBe("success");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("should throw after max retries exceeded", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("persistent failure"));

    await expect(retryWithBackoff(fn, { maxRetries: 3, initialDelay: 10 })).rejects.toThrow(
      "persistent failure"
    );
    expect(fn).toHaveBeenCalledTimes(4); // initial + 3 retries
  });

  it("should apply exponential backoff delays", async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error("fail 1"))
      .mockRejectedValueOnce(new Error("fail 2"))
      .mockResolvedValue("success");

    const delays: number[] = [];
    jest.spyOn(global, "setTimeout").mockImplementation(((callback: () => void, delay: number) => {
      delays.push(delay);
      callback();
      return {} as NodeJS.Timeout;
    }) as any);

    await retryWithBackoff(fn, { maxRetries: 3, initialDelay: 100 });

    expect(delays).toHaveLength(2);
    expect(delays[0]).toBe(100); // first retry: 100ms
    expect(delays[1]).toBe(200); // second retry: 200ms (exponential)

    jest.spyOn(global, "setTimeout").mockRestore();
  });

  it("should not retry if maxRetries is 0", async () => {
    const fn = jest.fn().mockRejectedValue(new Error("fail"));

    await expect(retryWithBackoff(fn, { maxRetries: 0 })).rejects.toThrow("fail");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("should only retry on specified error types", async () => {
    const networkError = new Error("ETIMEDOUT");
    (networkError as any).code = "ETIMEDOUT";
    const otherError = new Error("Invalid ticker");

    const fnNetwork = jest.fn().mockRejectedValue(networkError);
    const fnOther = jest.fn().mockRejectedValue(otherError);

    const shouldRetry = (error: unknown) => {
      return (error as any)?.code === "ETIMEDOUT";
    };

    // Should retry network errors
    await expect(
      retryWithBackoff(fnNetwork, { maxRetries: 2, initialDelay: 10, shouldRetry })
    ).rejects.toThrow("ETIMEDOUT");
    expect(fnNetwork).toHaveBeenCalledTimes(3);

    // Should not retry other errors
    await expect(
      retryWithBackoff(fnOther, { maxRetries: 2, initialDelay: 10, shouldRetry })
    ).rejects.toThrow("Invalid ticker");
    expect(fnOther).toHaveBeenCalledTimes(1);
  });
});
