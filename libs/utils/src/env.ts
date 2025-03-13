import { get } from 'lodash';

export function getNodeEnv(prop: string, defalut: any = '') {
  return get(process.env, prop, defalut);
}

export function setNodeEnv(prop: string, value: any) {
  process.env[prop] = value;
}
