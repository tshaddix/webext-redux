
import should from 'should';

import {getBrowserAPI} from "../src/util";

describe('#getBrowserAPI()', function () {
  it('should return the self chrome API if present', function () {
    self.chrome = {
      isChrome: true
    };
    self.browser = undefined;

    const browserAPI = getBrowserAPI();

    should(browserAPI).equals(self.chrome);
  });

  it('should return the self browser API if chrome is not present', function () {
    self.chrome = undefined;
    self.browser = {
      isBrowser: true
    };

    const browserAPI = getBrowserAPI();

    should(browserAPI).equals(self.browser);
  });

  it('should throw an error if neither the chrome or browser API is present', function () {
    self.chrome = undefined;
    self.browser = undefined;

    should.throws(() => getBrowserAPI());
  });
});
