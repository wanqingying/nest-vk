import { RedisClientType, RedisClusterType } from 'redis';

import { HashTagProvider, RedisCommandFunc } from './hash-tag-provider';
import { crc16, CRC16_MAX, crc16ToConstHashMap } from '../hash';

export interface NodeBasedHashTagProviderOptions {
  tryAgainDelay?: number;
  tryAgainAttempts?: number;
}

type SlotToMasterNodeMapping = Record<number, string>;
type MasterNodeToHashTagMapping = Record<string, string>;

export class NodeBasedHashTagProvider extends HashTagProvider {
  private static readonly SLOT_COUNT = CRC16_MAX;

  private cluster: RedisClusterType;

  private refreshMappingPromise: Promise<void>;

  private slotToMasterNode: SlotToMasterNodeMapping = {};
  private masterNodeToHashTag: MasterNodeToHashTagMapping = {};
  private hashTagToSlot: Record<string, number> = {};
  private slotToHash = crc16ToConstHashMap();

  public constructor(private readonly options: NodeBasedHashTagProviderOptions = {}) {
    super();
  }

  public async init(cluster: RedisClusterType): Promise<void> {
    this.cluster = cluster;
    await this.refreshMapping();
  }

  public getHashTag(key: string): string {
    const slot = crc16(key);
    const masterNode = this.slotToMasterNode[slot];
    return this.masterNodeToHashTag[masterNode];
  }

  public async getClientByHashTag(hashTag: string): Promise<RedisClientType> {
    return this.cluster.slots[this.hashTagToSlot[hashTag]].master.client;
  }

  // eslint-disable-next-line sonarjs/cognitive-complexity
  public async sendCommand(command: RedisCommandFunc): Promise<void> {
    let tryAgainCounter = 0;

    while (true) {
      try {
        return await command();
      } catch (error) {
        let refreshError: string;
        if (error.message.startsWith('ASK')) {
          refreshError = 'ASK';
        }
        if (error.message.startsWith('MOVED')) {
          refreshError = 'MOVED';
        }
        // is it ok to refresh on CROSSSLOT?
        if (error.message.startsWith('CROSSSLOT')) {
          refreshError = 'CROSSSLOT';
        }
        if (refreshError) {
          await this.refreshMapping();
          return await command();
        }

        const isTryAgain = error.message.startsWith('TRYAGAIN');
        if (isTryAgain) {
          if (this.options.tryAgainDelay && tryAgainCounter < this.options.tryAgainAttempts) {
            await new Promise(resolve => {
              setTimeout(resolve, this.options.tryAgainDelay);
            });
            tryAgainCounter++;
            continue;
          }
          return await command();
        }

        throw error;
      }
    }
  }

  private async refreshMapping(): Promise<void> {
    if (this.refreshMappingPromise) {
      await this.refreshMappingPromise;
      return;
    }
    this.refreshMappingPromise = new Promise(async resolve => {
      const client = await this.cluster.nodeClient(this.cluster.masters[0]);
      const nodesResult = await client.clusterNodes();
      this.resolveMapping(nodesResult);
      resolve();
    });
    this.refreshMappingPromise.finally(() => {
      this.refreshMappingPromise = undefined;
    });
    return this.refreshMappingPromise;
  }

  private resolveMapping(clusterNodesResult: Awaited<ReturnType<RedisClientType['clusterNodes']>>): void {
    const masterNodes = clusterNodesResult
      .map(node => new RedisNode(node.id, node.flags, node.slots))
      .filter(node => node.isMaster());

    const newSlotToMasterNode: SlotToMasterNodeMapping = {};
    const newMasterNodeToHashTag: MasterNodeToHashTagMapping = {};
    const newHashTagToSlot: Record<string, number> = {};

    for (let slot = 0; slot < NodeBasedHashTagProvider.SLOT_COUNT; slot++) {
      const masterNode = masterNodes.find(node => node.hasSlot(slot));
      if (!masterNode) {
        throw new Error(`No master node found for slot ${slot}`);
      }
      const masterNodeId = masterNode.getId();
      newSlotToMasterNode[slot] = masterNodeId;

      if (newMasterNodeToHashTag[masterNodeId] === undefined) {
        newMasterNodeToHashTag[masterNodeId] = this.slotToHash.get(slot).toString();
        newHashTagToSlot[this.slotToHash.get(slot).toString()] = slot;
      }
    }

    this.slotToMasterNode = newSlotToMasterNode;
    this.masterNodeToHashTag = newMasterNodeToHashTag;
    this.hashTagToSlot = newHashTagToSlot;
  }
}

// -----------------------------------------------------------------------------

class RedisNode {
  public constructor(
    private readonly id: string,
    private readonly flags: string[],
    private readonly slotRanges: { from: number; to: number }[],
  ) {}

  public getId(): string {
    return this.id;
  }

  public isMaster(): boolean {
    return this.flags.includes('master');
  }

  public isSlave(): boolean {
    return this.flags.includes('slave');
  }

  public hasSlot(slot: number): boolean {
    return this.slotRanges.some(({ from, to }) => slot >= from && slot <= to);
  }
}
