import calculateSlot from 'cluster-key-slot';

export const CRC16_MAX = 16384;

export function crc16(key: string): number {
  return calculateSlot(key);
}

let crc16ToConstHashMapCache: Map<number, string>;
export function crc16ToConstHashMap(): Map<number, string> {
  if (!crc16ToConstHashMapCache) {
    crc16ToConstHashMapCache = new Map();
    for (let i = 0; i < 110000; i++) {
      const crc = crc16(i.toString());

      if (!crc16ToConstHashMapCache.has(crc)) {
        crc16ToConstHashMapCache.set(crc, i.toString());
      }
    }
    for (let i = 0; i < CRC16_MAX; i++) {
      if (!crc16ToConstHashMapCache.has(i)) {
        crc16ToConstHashMapCache.set(i, i.toString());
      }
    }
  }

  return crc16ToConstHashMapCache;
}
