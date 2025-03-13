import { isIPv4, isIPv6 } from 'node:net';
import { StatusObject } from '@grpc/grpc-js/src/call-interface';
import { ChannelOptions } from '@grpc/grpc-js/src/channel-options';
import { Resolver, ResolverListener } from '@grpc/grpc-js/src/resolver';
import { TcpSubchannelAddress } from '@grpc/grpc-js/src/subchannel-address';
import { Metadata, experimental } from '@grpc/grpc-js';
import Consul from 'consul';
import { debounce } from 'lodash';
import fs from 'fs';

import path from 'node:path';

const IPV4_SCHEME = 'ipv4';
export interface GrpcUri {
  scheme?: string;
  authority?: string;
  path: string;
}

const URI_REGEX = /^(?:([A-Za-z0-9+.-]+):)?(?:\/\/([^/]*)\/)?(.+)$/;
export function parseUri(uriString: string): GrpcUri | null {
  const parsedUri = URI_REGEX.exec(uriString);
  if (parsedUri === null) {
    return null;
  }
  return {
    scheme: parsedUri[1],
    authority: parsedUri[2],
    path: parsedUri[3],
  };
}
export interface HostPort {
  host: string;
  port?: number;
}

const NUMBER_REGEX = /^\d+$/;
export function splitHostPort(path: string): HostPort | null {
  if (path.startsWith('[')) {
    const hostEnd = path.indexOf(']');
    if (hostEnd === -1) {
      return null;
    }
    const host = path.substring(1, hostEnd);
    /* Only an IPv6 address should be in bracketed notation, and an IPv6
     * address should have at least one colon */
    if (host.indexOf(':') === -1) {
      return null;
    }
    if (path.length > hostEnd + 1) {
      if (path[hostEnd + 1] === ':') {
        const portString = path.substring(hostEnd + 2);
        if (NUMBER_REGEX.test(portString)) {
          return {
            host: host,
            port: +portString,
          };
        } else {
          return null;
        }
      } else {
        return null;
      }
    } else {
      return {
        host,
      };
    }
  } else {
    const splitPath = path.split(':');
    /* Exactly one colon means that this is host:port. Zero colons means that
     * there is no port. And multiple colons means that this is a bare IPv6
     * address with no port */
    if (splitPath.length === 2) {
      if (NUMBER_REGEX.test(splitPath[1])) {
        return {
          host: splitPath[0],
          port: +splitPath[1],
        };
      } else {
        return null;
      }
    } else {
      return {
        host: path,
      };
    }
  }
}

export function uriToString(uri: GrpcUri): string {
  let result = '';
  if (uri.scheme !== undefined) {
    result += uri.scheme + ':';
  }
  if (uri.authority !== undefined) {
    result += '//' + uri.authority + '/';
  }
  result += uri.path;
  return result;
}

/**
 * The default TCP port to connect to if not explicitly specified in the target.
 */
const DEFAULT_PORT = 443;

export interface ConsulDisc {
  id: string;
  service: string;
  host: string;
  port: number;
  checks?: any;
}

export class IpV4Resolver implements Resolver {
  private addresses: TcpSubchannelAddress[] = [];
  private error: StatusObject | null = null;
  private consulClient: Consul;
  constructor(
    target: GrpcUri,
    private listener: ResolverListener,
    channelOptions: ChannelOptions,
  ) {
    this.updateResolution = debounce(this.updateResolution, 500);
    // trace('Resolver constructed for target ' + uriToString(target));
    console.log('Resolver constructed for target ' + uriToString(target));
    const addresses: TcpSubchannelAddress[] = [];
    if (!(target.scheme === IPV4_SCHEME)) {
      console.error('Unrecognized scheme ' + target.scheme + ' in IP resolver');
      return;
    }
    const pathList = target.path.split(',');
    for (const path of pathList) {
      const hostPort = splitHostPort(path);
      if (hostPort === null) {
        console.error('Failed to parse ' + target.scheme + ' address ' + path);
        return;
      }
      if (target.scheme === IPV4_SCHEME && !isIPv4(hostPort.host)) {
        console.error(
          'Failed to parse ' + target.scheme + ' address ' + hostPort.host,
        );
        return;
      }
      addresses.push({
        host: hostPort.host,
        port: hostPort.port ?? DEFAULT_PORT,
      });
    }
    this.addresses = addresses;
    console.log('Parsed ' + target.scheme + ' address list ' + this.addresses);
    // setTimeout(() => {
    //   this.addresses.shift();
    //   this.updateResolution();
    // }, 2000);
    this.initConsulWatch();
    this.initConsulService();
  }

  async initConsulService() {
    const mb = {
      ID: 'redis',
      Service: 'redis',
      Namespace: 'default',
      Port: 8000,
      Address: '',
    };
    const client = this.consulClient;
    const [checks, services] = await Promise.all([
      //xx
      client.agent.checks(),
      client.agent.services(),
    ]);
    const checkList = Array.from(Object.values(checks));
    const serviceList = Array.from(Object.values(services)) as (typeof mb)[];
    const newAddList: ConsulDisc[] = serviceList
      .filter((s) => {
        const status = checkList.find((c) => c.ServiceID === s.ID)?.Status;
        return status.toLowerCase() === 'passing';
      })
      .map((s) => {
        return {
          id: s.ID,
          service: s.Service,
          host: s.Address,
          port: s.Port,
        };
      });
    this.handleServiceChange(newAddList);
  }

  async initConsulWatch() {
    const consulClient = new Consul({
      host: 'localhost',
      // host: process.env.NODE_ENV === 'dev' ? 'localhost' : 'consul',
      port: 8500,
    });
    this.consulClient = consulClient;
    const watcher = consulClient.watch({
      method: consulClient.health.service,
      options: {
        service: 'nest-ai-api-grpc', // 替换为你要监听的服务名称
        // passing: true,
      },
    });

    watcher.on('change', async (data) => {
      // const fn=
      fs.writeFileSync(
        path.join(__dirname, `./logs/${Date.now().toString(36)}.json`),
        JSON.stringify(data),
        { flag: 'w+' },
      );
      const nodes = new Map<string, ConsulDisc>();
      const newAddList: ConsulDisc[] = [];
      if (!Array.isArray(data)) return;

      data.forEach((entry: any) => {
        const checks = entry.Checks.map((c) => c.Status);
        const isPass = checks.every((c) => c === 'passing');
        nodes.set(`${entry.Service.Address}:${entry.Service.Port}`, {
          id: entry.Service.ID,
          service: entry.Service.Service,
          host: entry.Service.Address,
          port: entry.Service.Port,
          checks: checks.join(','),
        });
        if (isPass) {
          newAddList.push({
            id: entry.Service.ID,
            service: entry.Service.Service,
            host: entry.Service.Address,
            port: entry.Service.Port,
          });
        }
      });
      this.handleServiceChange(newAddList);
    });

    watcher.on('error', (err) => {
      console.error('Error watching service:', err);
    });
  }

  private handleServiceChange(newAddList: ConsulDisc[]) {
    const newArr = newAddList.map((n) => `${n.host}:${n.port}`);
    const oldArr = this.addresses.map((n) => `${n.host}:${n.port}`);
    const hasNew = newArr.filter((n) => !oldArr.includes(n));
    const hasLost = oldArr.filter((n) => !newArr.includes(n));

    if (hasNew.length || hasLost.length) {
      console.log(
        `service changed new:${hasNew.join(',')} lost:${hasLost.join(',')}`,
      );
      this.addresses = this.filterAddress(
        newAddList.map((d) => {
          return {
            host: d.host,
            port: d.port,
          };
        }),
      );
      this.updateResolution();
    } else {
      console.log('service no change');
    }
  }

  private filterAddress(adds: TcpSubchannelAddress[]) {
    const map = new Map<string, TcpSubchannelAddress>();
    for (const add of adds) {
      map.set(`${add.host}:${add.port}`, add);
    }
    return Array.from(map.values());
  }

  updateResolution(): void {
    console.log('updateResolution', this.addresses.length);
    process.nextTick(() => {
      if (this.error) {
        this.listener.onError(this.error);
      } else {
        this.listener.onSuccessfulResolution(
          this.addresses.map((add) => ({ addresses: [add] })),
          null,
          null,
          null,
          {},
        );
      }
    });
  }
  destroy(): void {
    // This resolver owns no resources, so we do nothing here.
  }

  static getDefaultAuthority(target: GrpcUri): string {
    return target.path.split(',')[0];
  }

  public static setup() {
    experimental.registerResolver(IPV4_SCHEME, IpV4Resolver as any);
  }
}
