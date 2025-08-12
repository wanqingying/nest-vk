import autocannon from 'autocannon';

// Generate test data with 500 offers
function generateOffers(count: number) {
  const offers = [];
  for (let i = 1; i <= count; i++) {
    offers.push({
      id: `auto-test-game-${i}`,
    });
  }
  return offers;
}

function getTestData() {
  return {
    userId:
      '66ab4a056995cd5ed6b7+' + Math.random().toString(36).substring(2, 6),
    offers: generateOffers(500),
  };
}

async function runProgressiveQPSTest() {
  const stages = [
    { connections: 1, duration: 5, name: 'Low Load (1 connection)' },
    { connections: 5, duration: 30, name: 'Medium Load (5 connections)' },
	{ connections: 5, duration: 1800, name: 'Medium Load (5 connections)' },
    // { connections: 10, duration: 20, name: 'High Load (10 connections)' },
    // { connections: 20, duration: 30, name: 'Ultra High Load (20 connections)' },
    // { connections: 40, duration: 30, name: 'Ultra High Load (40 connections)' },
  ];

  console.log('Starting progressive QPS testing...\n');

  for (const stage of stages) {
    console.log(`\n=== ${stage.name} ===`);

    const result = await autocannon({
      url: 'http://localhost:3055/internal/ranking/rank',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(getTestData()),
      connections: stage.connections,
      duration: stage.duration,
    });

    console.log(`Connections: ${stage.connections}`);
    console.log(`Duration: ${stage.duration} seconds`);
    console.log(`Average QPS: ${result.requests.average}`);
    console.log(`Max QPS: ${result.requests.max}`);
    console.log(`Average Latency: ${result.latency.average}ms`);
    console.log(`Errors: ${result.errors}`);

    // Wait 2 seconds between stages
    if (stage !== stages[stages.length - 1]) {
      console.log('Waiting 2 seconds before next stage...');
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }
}

console.log('Running autocannon http test...');
// runRankingBenchmark().catch(console.error);
// runRankingBenchmark2().catch(console.error);
runProgressiveQPSTest().catch(console.error);
