import os from 'os';
export function getHostIp(internal: boolean = false) {
  const interfaces = os.networkInterfaces();
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
