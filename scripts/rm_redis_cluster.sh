# filepath: [rm_redis_cluster.sh](http://_vscodecontentref_/0)
#!/bin/bash


# del node
redis-cli --cluster reshard redis-cluster:6379 \
	      --cluster-from 2c1e2044ed6e336985191c337f4a69c348401ef0 \
		  --cluster-to 804d89f6f6e7cace0cf3f00b4d901f6b21c4c53e \
		  --cluster-slots 16384 \
		  --cluster-yes 

# add node
# redis-cli --cluster add-node redis-6:6379 redis-cluster:6379
# redis-cli --cluster rebalance redis-cluster:6379 --cluster-use-empty-masters
# redis-cli --cluster-yes