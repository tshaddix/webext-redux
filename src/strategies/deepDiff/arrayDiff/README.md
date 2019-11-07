fast-array-diff
======================
[![MIT Licence](https://badges.frapsoft.com/os/mit/mit.svg?v=103)](https://opensource.org/licenses/mit-license.php)

This implementation was ported to JavaScript from Typescript base on version0.2.0 of
[YuJianrong's fast-array-diff package](https://github.com/YuJianrong/fast-array-diff).

```fast-array-diff``` is a npm module to find the common or different parts of two array, it based on the solution of LCS (Longest common subsequence) problems, widely used in diff/patch of two arrays (like diff/patch feature in git).

The algorithm of this module is implemented based on the paper "An O(ND) Difference Algorithm and its Variations" by Eugene Myers, Algorithm Vol. 1 No. 2, 1986, pp. 251-266. The difference of this implementation to the implementation of npm module [diff](https://www.npmjs.com/package/diff) is: the space complexity of this implementation is O(N), while the implementation of ```diff``` is O(ND), so this implementation will cost less memory on large data set. Note: although the time complexity of the implementations are both O(ND), this implementation run slower than the ```diff```.

API
----------------------
* `same(arrayOld, arrayNew, compareFunc?)` - Get the LCS of the two arrays.

    Return a list of the common subsequence. Like: ```[1,2,3]```

    *Note: The parameter `compareFunc` is optional, `===` will be used if no compare function supplied.*

* `diff(arrayOld, arrayNew, compareFunc?)` - Get the difference the two array.

    Return an object of the difference. Like this:

```
{
    removed: [1,2,3],
    added: [2,3,4]
}
```

* `getPatch(arrayOld, arrayNew, compareFunc?)` - Get the patch array which transform from old array to the new.

    Return an array of edit action. Like this:

```
[
    { type: "remove", oldPos: 0, newPos: 0, items: [1] },
    { type: "add", oldPos: 3, newPos: 2, items: [4] },
]
```


* `applyPatch(arrayOld, patchArray)` - Thansform the old array to the new from the input patch array

    Return the new Array. The input value format can be same of return value of ```getPatch```, and for the ```remove``` type,
    the ```items``` can be replaced to ```length``` value which is number.

```
[
    { type: "remove", oldPos: 0, newPos: 0, items: [1] },
    { type: "add", oldPos: 3, newPos: 2, items: [4] },
    { type: "remove", oldPos: 5, newPos: 3, length: 3 },
]
```

Examples
----------------------

Example for ```same``` on array of number:

```js
var diff = require("fast-array-diff");

console.log( diff.same([1, 2, 3, 4], [2, 1, 4]));
// Output: [2, 4]
```

Example for ```diff``` on array of Object with a compare function

```js
function compare(personA, personB) {
    return personA.firstName === personB.firstName && personA.lastName === personB.lastName;
}

var result = diff.diff([
        { firstName: "Foo", lastName: "Bar" },
        { firstName: "Apple",  lastName: "Banana" },
        { firstName: "Foo", lastName: "Bar" }
    ], [
        { firstName: "Apple", lastName: "Banana" },
        { firstName: "Square", lastName: "Triangle" }
    ],
    compare
);

// Result is :
// {
//    removed:[
//        { firstName: 'Foo', lastName: 'Bar' },
//        { firstName: 'Foo', lastName: 'Bar' } 
//    ],
//    added: [ { firstName: 'Square', lastName: 'Triangle' } ] 
// }
```

Example for ```getPatch``` on array of number:

```js
var es = diff.getPatch([1, 2, 3], [2, 3, 4]);

// Result is:
// [
//     { type: "remove", oldPos: 0, newPos: 0, items: [1] },
//     { type: "add", oldPos: 3, newPos: 2, items: [4] },
// ]
```

Example for ```applyPatch```:

```js
var arr = diff.applyPatch([1, 2, 3], [
    { type: "remove", oldPos: 0, newPos: 0, length: 1 },
    { type: "add", oldPos: 3, newPos: 2, items: [4] },
]);

// Result is:
// [2, 3, 4]
```


## License

This module is licensed under MIT.
