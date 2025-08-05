const path = require('path');
const Piscina = require('piscina');

const piscina = new Piscina({
  filename: path.resolve(__dirname, 'worker.js')
});

(async function() {
  const result = await piscina.run({ a: 4, b: 6 });
  console.log(result);  // Prints 10
})();