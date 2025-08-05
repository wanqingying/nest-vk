import path from "node:path"
import fs from "node:fs"

const file= path.resolve(__dirname, 'worker.js')
const f2='game-cash-ranking/lgbm_regression_predictor_v2.js'
console.log('Worker file path:', file)
// const u= new URL(file, '')
// const u = new URL(`file://${file}`)
const f=path.parse(file)

console.log('Worker file URL:', f)
const fv2=path.parse(f2);
console.log('Worker file URL:', fv2)
const f3='s3://flip-ml-test/game-cash-ranking/lgbm_regression_predictor_v2.js';
const fv3=path.parse(f3);
console.log('Worker file URL:', fv3)
