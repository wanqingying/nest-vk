import os from 'os';

// nest-tewst  | interfaces {
// 	nest-tewst  |   "lo": [
// 	nest-tewst  |     {
// 	nest-tewst  |       "address": "127.0.0.1",
// 	nest-tewst  |       "netmask": "255.0.0.0",
// 	nest-tewst  |       "family": "IPv4",
// 	nest-tewst  |       "mac": "00:00:00:00:00:00",
// 	nest-tewst  |       "internal": true,
// 	nest-tewst  |       "cidr": "127.0.0.1/8"
// 	nest-tewst  |     },
// 	nest-tewst  |     {
// 	nest-tewst  |       "address": "::1",
// 	nest-tewst  |       "netmask": "ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff",
// 	nest-tewst  |       "family": "IPv6",
// 	nest-tewst  |       "mac": "00:00:00:00:00:00",
// 	nest-tewst  |       "internal": true,
// 	nest-tewst  |       "cidr": "::1/128",
// 	nest-tewst  |       "scopeid": 0
// 	nest-tewst  |     }
// 	nest-tewst  |   ],
// 	nest-tewst  |   "eth0": [
// 	nest-tewst  |     {
// 	nest-tewst  |       "address": "172.20.0.3",
// 	nest-tewst  |       "netmask": "255.255.0.0",
// 	nest-tewst  |       "family": "IPv4",
// 	nest-tewst  |       "mac": "02:42:ac:14:00:03",
// 	nest-tewst  |       "internal": false,
// 	nest-tewst  |       "cidr": "172.20.0.3/16"
// 	nest-tewst  |     }
// 	nest-tewst  |   ]
// 	nest-tewst  | }
export function getHostIp(internal: boolean = false) {

  const interfaces = os.networkInterfaces();
  console.log('interfaces', JSON.stringify(interfaces, null, 2));
  if (process.env.NODE_ENV === 'dev') {
    return '127.0.0.1';
  }
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && iface.internal === internal) {
        return iface.address;
      }
    }
  }
}
