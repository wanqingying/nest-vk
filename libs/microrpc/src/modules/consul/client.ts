import Consul from 'consul';
import {
  NodeCheckType,
  AgentServiceType,
  NodeServiceType,
  HealthServiceDetailType,
} from './consul.type';
import EventEmitter from 'node:events';
import { getConsulHost } from '@app/utils/env';
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

  public async waitReady() {
    return new Promise<void>((resolve) => {
      if (this.hasInit) {
        console.log('ready already');
        resolve();
      } else {
        this.once('pass', (data) => {
          console.log('ready on pass', data);
          resolve();
        });
      }
    });
  }

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
      host: getConsulHost(),
      port: 8500,
    });
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

  public async initStateWatcher() {
    console.log('initStateWatcher', this.serviceName ,getConsulHost());
    const consulClient = this.client;
    const watcher = consulClient.watch({
      method: consulClient.health.checks,
      options: {
        service: this.serviceName,
      },
    });

    watcher.on('change', async (data: NodeCheckType[]) => {
      const nodes = new Map<string, ConsulServiceNode>();
      if (!Array.isArray(data)) return;
      await this.syncNodesWithConsul();
      console.log('nodes', Array.from(this.nodes.values()).length);
      console.log('change', data.length);

      data.forEach((entry) => {
        if (!this.nodes.has(entry.ServiceID)) {
          console.error('service node not found', entry.ServiceID);
          return;
        }
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
      this.handleServiceChange(arr);
    });

    watcher.on('error', (err) => {
      console.error('Error watching service:', err);
    });
  }

  private handleServiceChange(newAddList: ConsulServiceNode[]) {
    this.emit('pass', newAddList);
  }
  public getPassNodes() {
    const m = new Map();
    Array.from(this.nodes.values())
      .filter((n) => n.status === 'passing')
      .forEach((n) => {
        m.set(`${n.host}:${n.port}`, n);
      });

    return Array.from(m.values());
  }
}
