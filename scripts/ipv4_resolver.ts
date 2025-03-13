import { isIPv4, isIPv6 } from 'node:net';

import { StatusObject } from '@grpc/grpc-js/src/call-interface';
import { ChannelOptions } from '@grpc/grpc-js/src/channel-options';
import {
  registerResolver,
  Resolver,
  ResolverListener,
} from '@grpc/grpc-js/src/resolver';
import { TcpSubchannelAddress } from '@grpc/grpc-js/src/subchannel-address';
import { Metadata, experimental } from '@grpc/grpc-js';
import Consul from 'consul';

const TRACER_NAME = 'ip_resolver';

const IPV4_SCHEME = 'ipv4';

export interface GrpcUri {
  scheme?: string;
  authority?: string;
  path: string;
}

/*
 * The groups correspond to URI parts as follows:
 * 1. scheme
 * 2. authority
 * 3. path
 */
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
  // id: entry.Service.ID,
  // service: entry.Service.Service,
  // host: entry.Service.Address,
  // port: entry.Service.Port,
  id: string;
  service: string;
  host: string;
  port: number;
}

export class IpV4Resolver implements Resolver {
  private addresses: TcpSubchannelAddress[] = [];
  private consulDict: Map<string, ConsulDisc> = new Map();
  private error: StatusObject | null = null;
  constructor(
    target: GrpcUri,
    private listener: ResolverListener,
    channelOptions: ChannelOptions,
  ) {
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
        this.error = {
          code: Status.UNAVAILABLE,
          details: `Failed to parse ${target.scheme} address ${path}`,
          metadata: new Metadata(),
        };
        return;
      }
      if (target.scheme === IPV4_SCHEME && !isIPv4(hostPort.host)) {
        this.error = {
          code: Status.UNAVAILABLE,
          details: `Failed to parse ${target.scheme} address ${path}`,
          metadata: new Metadata(),
        };
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
    this.initConsul();
  }

  async initConsul() {
    const consulClient = new Consul({
      host: 'localhost',
      // host: process.env.NODE_ENV === 'dev' ? 'localhost' : 'consul',
      port: 8500,
    });
    const watcher = consulClient.watch({
      method: consulClient.health.service,
      options: {
        service: 'nest-ai-api-grpc', // 替换为你要监听的服务名称
        // passing: true,
      },
    });

    watcher.on('change', async (data) => {
      const example = {
        Node: {
          ID: '4a05d998-cebc-eb6f-567c-b7eda4a9ca20',
          Node: 'aa38e96e5d10',
          Address: '172.20.0.2',
          Datacenter: 'dc1',
          TaggedAddresses: {
            lan: '172.20.0.2',
            lan_ipv4: '172.20.0.2',
            wan: '172.20.0.2',
            wan_ipv4: '172.20.0.2',
          },
          Meta: {
            'consul-network-segment': '',
            'consul-version': '1.20.5',
          },
          CreateIndex: 13,
          ModifyIndex: 15,
        },
        Service: {
          ID: 'nest-ai-api-grpc-s8fvk',
          Service: 'nest-ai-api-grpc',
          Tags: [],
          Address: '127.0.0.1',
          TaggedAddresses: {
            lan_ipv4: {
              Address: '127.0.0.1',
              Port: 3010,
            },
            wan_ipv4: {
              Address: '127.0.0.1',
              Port: 3010,
            },
          },
          Meta: null,
          Port: 3010,
          Weights: {
            Passing: 1,
            Warning: 1,
          },
          EnableTagOverride: false,
          Proxy: {
            Mode: '',
            MeshGateway: {},
            Expose: {},
          },
          Connect: {},
          PeerName: '',
          CreateIndex: 33,
          ModifyIndex: 33,
        },
        Checks: [
          {
            Node: 'aa38e96e5d10',
            CheckID: 'serfHealth',
            Name: 'Serf Health Status',
            Status: 'passing',
            Notes: '',
            Output: 'Agent alive and reachable',
            ServiceID: '',
            ServiceName: '',
            ServiceTags: [],
            Type: '',
            Interval: '',
            Timeout: '',
            ExposedPort: 0,
            Definition: {},
            CreateIndex: 13,
            ModifyIndex: 13,
          },
          {
            Node: 'aa38e96e5d10',
            CheckID: 'service:nest-ai-api-grpc-s8fvk',
            Name: 'http-check-nest-ai-api-grpc-host.docker.internal',
            Status: 'critical',
            Notes: '',
            Output:
              'Get "http://host.docker.internal:3008/health": dial tcp 192.168.65.254:3008: connect: connection refused',
            ServiceID: 'nest-ai-api-grpc-s8fvk',
            ServiceName: 'nest-ai-api-grpc',
            ServiceTags: [],
            Type: 'http',
            Interval: '15s',
            Timeout: '3s',
            ExposedPort: 0,
            Definition: {},
            CreateIndex: 33,
            ModifyIndex: 139,
          },
        ],
      };

      const nodes: any[] = [];
      const newAddList: ConsulDisc[] = [];
      data.forEach((entry: typeof example) => {
        const checks = entry.Checks.map((c) => c.Status);
        const isPass = checks.every((c) => c === 'passing');
        nodes.push({
          id: entry.Service.ID,
          host: entry.Service.Address,
          port: entry.Service.Port,
          checks: checks,
          isPass: isPass,
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
      const newArr = newAddList.map((n) => `${n.host}:${n.port}`);
      const oldArr = this.addresses.map((n) => `${n.host}:${n.port}`);
      const hasNew = newArr.filter((n) => !oldArr.includes(n));
      const hasLost = oldArr.filter((n) => !newArr.includes(n));

      if (hasNew.length || hasLost.length) {
        console.log(`service changed new:${hasNew.join(',')} lost:${hasLost.join(',')}`);
        this.addresses = newAddList.map((d) => {
          return {
            host: d.host,
            port: d.port,
          };
        });
        this.updateResolution();
      }else{
        console.log('service no change');
      }
    });

    watcher.on('error', (err) => {
      console.error('Error watching service:', err);
    });
  }

  private handleServiceChange(list: ConsulDisc[]) {

  }


  updateResolution(): void {
    console.log('updateResolution', this.addresses);
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
