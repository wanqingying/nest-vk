import path from 'node:path';
import util from 'node:util';

console.log('hello vvv'); // "scripts/hello.js"

const d1 = new Date(undefined);
const d2 = new Date();
console.log(d1 > d2); // "scripts/hello.js"
console.log(d1 < d2); // "scripts/hello.js"
console.log(d1 == d2); // "scripts/hello.js"
