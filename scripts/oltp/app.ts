/*app.ts*/
import { tracer, trace } from './instru';
import express, { Express } from 'express';

const PORT: number = parseInt(process.env.PORT || '8084');
const app: Express = express();

function getRandomNumber(min: number, max: number) {
  for (let i = 0; i < 1000000; i++) {
    Math.random();
  }
  return Math.floor(Math.random() * (max - min + 1) + min);
}

app.get('/rolldice', (req, res) => {
  return trace('rolldicev2', async (span) => {
    const res3 = getRandomNumber(1, 6).toString();
    span.addEvent('Rolled a dice', { value: res3 });
    res.send(res3);
  });
  //   const span = tracer.startSpan('rolldice');
  //   const randomNumber = getRandomNumber(1, 64);
  //   span.addEvent('Rolled a dice', { value: randomNumber });
  //   span.end();
  //   res.send(randomNumber.toString());
});

app.listen(PORT, () => {
  console.log(`Listening for requests on http://localhost:${PORT}`);
});
