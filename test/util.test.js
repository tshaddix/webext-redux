
import should from 'should';

import {getBrowserAPI} from "../src/util";

describe('#getBrowserAPI()', function () {
  it('should return the global chrome API if present', function () {
    global.chrome = {
      isChrome: true
    };
    global.browser = undefined;

    const browserAPI = getBrowserAPI();

    should(browserAPI).equals(global.chrome);
  });

  it('should return the global browser API if chrome is not present', function () {
    global.chrome = undefined;
    global.browser = {
      isBrowser: true
    };

    const browserAPI = getBrowserAPI();

    should(browserAPI).equals(global.browser);
  });

  it('should throw an error if neither the chrome or browser API is present', function () {
    global.chrome = undefined;
    global.browser = undefined;

    should.throws(() => getBrowserAPI());
  });
});
