const { log } = require('console');
const os = require('os');

function logLocalIPAddress() {
  const interfaces = os.networkInterfaces();
  console.log('interfaces', JSON.stringify(interfaces, null, 2));
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (const alias of iface) {
      // log all ip 
	  console.log(interfaceName, alias.address);
    }
  }
  return '0.0.0.0';
}

setTimeout(() => {
	console.log('logLocalIPAddress', logLocalIPAddress());
}, 18000);

logLocalIPAddress();

// console.log(getLocalIPAddress());