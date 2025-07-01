import dns from "node:dns"


const host='t-server';

export async function resolveHost(host: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
	dns.resolve4(host, (err, addresses) => {
	  if (err) {
		console.error(`Error resolving host ${host}:`, err);
		reject(err);
	  } else {
		console.log(`Resolved ${host} to:`, addresses);
		resolve(addresses);
	  }
	});
  });
}

resolveHost(host).catch(console.error)

