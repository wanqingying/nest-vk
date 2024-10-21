import { get } from 'lodash';

export function getNodeEnv(prop: string, defalut: any = '') {
  return get(process.env, prop, defalut);
}

export function setNodeEnv(prop: string, value: any) {
  process.env[prop] = value;
}

export function getServerNodeId() {
  let id = getNodeEnv('CONSUL_ID');
  if (!id) {
    id = Math.random().toString(36).substring(7);
    setNodeEnv('CONSUL_ID', id);
  }
  return id;
}

export function getConsulHost() {
  if (getNodeEnv('NODE_ENV') === 'dev') {
    return 'localhost';
  } else {
    return 'consul';
  }
}
