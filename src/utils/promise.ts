export const getPromiseSettleRejects = <T>(
  settled: PromiseSettledResult<T>[]
) =>
  settled.filter(
    (item) => item.status === 'rejected'
  ) as PromiseRejectedResult[];

export const getPromiseSettleFulfills = <T>(
  settled: PromiseSettledResult<T>[]
) =>
  settled.filter(
    (item) => item.status === 'fulfilled'
  ) as PromiseFulfilledResult<T>[];

export const handleSettledPromise = <T>(
  settled: PromiseSettledResult<T>[],
  displayErrors = true
) => {
  const rejected = getPromiseSettleRejects(settled);
  const fulfilled = getPromiseSettleFulfills(settled);

  if (displayErrors && rejected.length)
    console.error(`Rejected`, rejected.length, rejected);

  return fulfilled.map((item) => item.value);
};

export const sleep = (ms = 0) =>
  new Promise((resolve) => setTimeout(resolve, ms));
