import { DIFF_STATUS_UPDATED, DIFF_STATUS_REMOVED } from "../constants";

export default function (obj, difference) {
  const newObj = Object.assign({}, obj);

  difference.forEach(({change, key, value}) => {
    switch (change) {
      case DIFF_STATUS_UPDATED:
        newObj[key] = value;
        break;

      case DIFF_STATUS_REMOVED:
        Reflect.deleteProperty(newObj, key);
        break;

      default:
        // do nothing
    }
  });

  return newObj;
}