/**
 * Looks for a global browser api, first checking the chrome namespace and then
 * checking the browser namespace. If no appropriate namespace is present, this
 * function will throw an error.
 */
export function getBrowserAPI() {
  let api;

  try {
    // eslint-disable-next-line no-undef
    api = self.chrome || self.browser || browser;
  } catch (error) {
    // eslint-disable-next-line no-undef
    api = browser;
  }

  if (!api) {
    throw new Error("Browser API is not present");
  }

  return api;
}
