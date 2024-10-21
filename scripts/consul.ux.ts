import fs from 'fs';
import path from 'node:path';
import Consul from 'consul';
import {
  NodeCheckType,
  AgentServiceType,
  NodeServiceType,
  HealthServiceDetailType,
} from './consul.type';
import EventEmitter from 'node:events';

export interface ConsulServiceNode {
  id: string;
  service: string;
  host: string;
  port: number;
  status?: 'unkonwn' | 'passing' | 'warning' | 'critical';
}

export class ConsulClient extends EventEmitter {
  private client: Consul;
  private nodes = new Map<string, ConsulServiceNode>();
  private serviceName: string;
  private static ServiceMap = new Map<string, ConsulClient>();
  private hasInit = false;

  public static getServiceClient(serviceName: string) {
    if (!ConsulClient.ServiceMap.has(serviceName)) {
      ConsulClient.ServiceMap.set(serviceName, new ConsulClient(serviceName));
    }
    return ConsulClient.ServiceMap.get(serviceName);
  }

  constructor(serviceName: string) {
    super();
    this.serviceName = serviceName;
    this.client = new Consul({
      host: 'localhost',
      // host: process.env.NODE_ENV === 'dev' ? 'localhost' : 'consul',
      port: 8500,
    });
    // this.syncNodesWithConsul();
    this.initStateWatcher();
  }

  public filterAliveAddress(list: { host: string; port: number }[]) {
    if (!this.hasInit) return list;
    const m = new Map();
    for (const s of Array.from(this.nodes.values())) {
      if (s.status !== 'passing') continue;
      m.set(`${s.host}:${s.port}`, s.status);
    }
    return list.filter((s) => m.has(`${s.host}:${s.port}`));
  }

  public async syncNodesWithConsul() {
    const res = await this.client.agent.services();
    const list = Array.from(Object.values(res)) as NodeServiceType[];
    this.nodes.clear();
    for (const s of list) {
      this.nodes.set(s.ID, {
        id: s.ID,
        service: s.Service,
        host: s.Address,
        port: s.Port,
        status: 'unkonwn',
      });
    }
  }
  public async getPassingNodes() {
    const res = await this.client.health.service({
      service: 'nest-ai-api-grpc',
      passing: true,
    });
    const arr = res as HealthServiceDetailType[];
    console.log('pass', arr.length);
    const m = new Map<string, string>();
    arr.forEach((s) => {
      const sp = `${s.Service.Address}:${s.Service.Port}`;
      m.set(sp, sp);
      return `${s.Service.Address}:${s.Service.Port}`;
    });
    console.log('passing ', Array.from(m.keys()).join(','));
    return arr;
  }

  public async initServiceWatcher() {
    const consulClient = this.client;
    const watcher = consulClient.watch({
      method: consulClient.health.node,
      options: {
        service: 'nest-ai-api-grpc', // 替换为你要监听的服务名称
      },
    });

    watcher.on('change', async (data) => {
      // const fn=
      fs.writeFileSync(
        path.join(
          __dirname,
          `./logs/service_${String(Date.now()).substring(6)}.json`,
        ),
        JSON.stringify(data, null, 2),
        { flag: 'w+' },
      );
      const nodes = new Map<string, ConsulServiceNode>();
      const avtiveNodeList: ConsulServiceNode[] = [];
      if (!Array.isArray(data)) return;

      data.forEach((entry: any) => {
        const checks = entry.Checks.map((c) => c.Status);
        const isPass = checks.every((c) => c === 'passing');
        nodes.set(`${entry.Service.Address}:${entry.Service.Port}`, {
          id: entry.Service.ID,
          service: entry.Service.Service,
          host: entry.Service.Address,
          port: entry.Service.Port,
        });
        if (isPass) {
          avtiveNodeList.push({
            id: entry.Service.ID,
            service: entry.Service.Service,
            host: entry.Service.Address,
            port: entry.Service.Port,
          });
        }
      });
      const nm = new Map();
      for (const n of avtiveNodeList) {
        nm.set(`${n.host}:${n.port}`, n);
      }
      const arr = Array.from(nm.values());
      console.log('living ', Array.from(nm.keys()).join(','));
      //   this.handleServiceChange(newAddList);
    });

    watcher.on('error', (err) => {
      console.error('Error watching service:', err);
    });
  }
  public async initStateWatcher() {
    const consulClient = this.client;
    const watcher = consulClient.watch({
      method: consulClient.health.checks,
      options: {
        service: 'nest-ai-api-grpc', // 替换为你要监听的服务名称
      },
    });

    watcher.on('change', async (data: NodeCheckType[]) => {
      const nodes = new Map<string, ConsulServiceNode>();
      if (!Array.isArray(data)) return;
      await this.syncNodesWithConsul();

      data.forEach((entry) => {
        if (!this.nodes.has(entry.ServiceID)) return;
        const node = this.nodes.get(entry.ServiceID);
        node.status = entry.Status as any;
        if (entry.Status !== 'passing') return;
        nodes.set(`${node.host}:${node.port}`, {
          ...node,
        });
      });
      this.hasInit = true;

      const arr = Array.from(nodes.values());
      console.log('living ', Array.from(nodes.keys()).join(','));
      //   await this.getPassingNodes();
      //   this.handleServiceChange(newAddList);
      this.handleServiceChange(arr);
    });

    watcher.on('error', (err) => {
      console.error('Error watching service:', err);
    });
  }

  private handleServiceChange(newAddList: ConsulServiceNode[]) {
	console.log('trigger pass');
    this.emit('pass', newAddList);
  }
}
