import { Piscina } from 'piscina';
import path from 'node:path';

async function main() {
  const piscina = new Piscina({
    // The URL must be a file:// URL
    // filename: new URL('./worker.mjs', import.meta.url).href
    filename: path.resolve(__dirname, 'worker.js'),
  });

  const result = await piscina.run({ a: 4, b: 6 });
  console.log(result); // Prints 10
}
main().catch(console.error);
