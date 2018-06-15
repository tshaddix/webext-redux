import { DIFF_STATUS_KEYS_UPDATED, DIFF_STATUS_REMOVED, DIFF_STATUS_UPDATED } from "../constants";

export default function patchObject(obj, patches) {
  // Start with a shallow copy of the object.
  const newObject = { ...obj };
  // Iterate through the patches.
  patches.forEach(patch => {
    // If the value is an object whose keys are being updated,
    // then recursively patch the object.
    if (patch.type === DIFF_STATUS_KEYS_UPDATED) {
      newObject[patch.key] = patchObject(newObject[patch.key], patch.value);
    }
    // If the key has been deleted, delete it.
    else if (patch.type === DIFF_STATUS_REMOVED) {
      delete newObject[patch.key];
    }
    // If the key has been updated to a new value, update it.
    else if (patch.type === DIFF_STATUS_UPDATED) {
      newObject[patch.key] = patch.value
    }
  });
  return newObject;
}