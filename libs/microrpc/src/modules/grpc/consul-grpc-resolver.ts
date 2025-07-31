import { isIPv4, isIPv6 } from 'node:net';
// import { ChannelOptions } from '@grpc/grpc-js/src/channel-options';
// import { Resolver, ResolverListener } from '@grpc/grpc-js/src/resolver';
import { Metadata, experimental } from '@grpc/grpc-js';
import { debounce } from 'lodash';
import {
  ConsulClient,
  ConsulServiceNode,
} from '@libs/microrpc/src/modules/consul/client';

export interface TcpSubchannelAddress {
  port: number;
  host: string;
}
export enum Status {
  OK = 0,
  CANCELLED,
  UNKNOWN,
  INVALID_ARGUMENT,
  DEADLINE_EXCEEDED,
  NOT_FOUND,
  ALREADY_EXISTS,
  PERMISSION_DENIED,
  RESOURCE_EXHAUSTED,
  FAILED_PRECONDITION,
  ABORTED,
  OUT_OF_RANGE,
  UNIMPLEMENTED,
  INTERNAL,
  UNAVAILABLE,
  DATA_LOSS,
  UNAUTHENTICATED,
}
export interface StatusObject {
  code: Status;
  details: string;
  metadata: Metadata;
}

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

// implements Resolver
export class ConsulGRPCIPV4Resolver {
  private addresses: TcpSubchannelAddress[] = [];
  private error: StatusObject | null = null;
  private consulClient: ConsulClient;
  constructor(
    target: GrpcUri,
    // private listener: ResolverListener,
    private listener: any,
    channelOptions: any,
  ) {
    this.updateResolution = debounce(this.updateResolution.bind(this), 500);
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
    console.log(
      'Parsed ' +
        target.scheme +
        ' address list ' +
        JSON.stringify(this.addresses, null, 2),
    );

    this.consulClient = ConsulClient.getServiceClient('nest-grpc-server');
    this.initConsulWatch();
  }

  async initConsulWatch() {
    this.consulClient.on('pass', (newList: ConsulServiceNode[]) => {
      this.handleServiceChange(newList);
    });
  }

  private handleServiceChange(newAddList: ConsulServiceNode[]) {
    const newArr = newAddList.map((n) => `${n.host}:${n.port}`);
    const oldArr = this.addresses.map((n) => `${n.host}:${n.port}`);
    const hasNew = newArr.filter((n) => !oldArr.includes(n));
    const hasLost = oldArr.filter((n) => !newArr.includes(n));

    if (hasNew.length || hasLost.length) {
      this.addresses = newAddList.map((d) => {
        return {
          host: d.host,
          port: d.port,
        };
      });
      console.log(
        `service changed :${this.addresses.map((p) => `${p.host}:${p.port}`).join(',')}`,
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
    console.log('addresses', this.addresses.length);
    const submitAddList = this.filterAddress(this.addresses);
    const aliveList = this.consulClient.filterAliveAddress(submitAddList);
    console.log(
      'submit ',
      aliveList.map((p) => `${p.host}:${p.port}`).join(','),
    );
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
    experimental.registerResolver(IPV4_SCHEME, ConsulGRPCIPV4Resolver as any);
  }
}
