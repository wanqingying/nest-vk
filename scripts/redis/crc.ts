function slotByKey(key: string) {
    // A more randomized hash function for slot calculation
    const hash = (key: string) => {
        let h = 0;
        for (let i = 0; i < key.length; i++) {
            h = Math.imul(h ^ key.charCodeAt(i), 0x5bd1e995);
            h = (h << 13) | (h >>> 19);
        }
        return h >>> 0; // Ensure unsigned 32-bit integer
    };

    const slot = hash(key) % 16384;
    // console.log(`slot-${key}=${slot}`);
    return slot;
}

function cost(){
	const tStart= Date.now();

	for(let i=0;i<30000;i++){
		const key=`key-${i}`;
		const slot=slotByKey(key);
	}
	console.log(`cost=${Date.now()-tStart}`);
}
function hashNumber(num: number): number {
    let hash = num;
    hash = Math.imul(hash ^ 0x5bd1e995, 0x5bd1e995); // 混合乘法和异或操作
    hash = (hash << 13) | (hash >>> 19); // 左移和右移混合
    return (hash >>> 0)%146; // 确保结果为无符号 32 位整数
}
console.log(hashNumber(1))
console.log(hashNumber(2))
console.log(hashNumber(4))
console.log(hashNumber(1))
console.log(hashNumber(1))
let i=5;
console.log(i++)
console.log(++i)




