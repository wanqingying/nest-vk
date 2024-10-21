// health.checks event
const CheckEx = {
  Node: 'fb50411dd8e5',
  CheckID: 'service:nest-ai-api-grpc-xgofzh',
  Name: 'http-check-nest-ai-api-grpc-host.docker.internal',
  Status: 'passing',
  Notes: '',
  Output:
    'HTTP GET http://host.docker.internal:3008/health: 200 OK Output: ok-lh9azj',
  ServiceID: 'nest-ai-api-grpc-xgofzh',
  ServiceName: 'nest-ai-api-grpc',
  ServiceTags: [],
  Type: 'http',
  Interval: '15s',
  Timeout: '3s',
  ExposedPort: 0,
  Definition: {},
  CreateIndex: 127,
  ModifyIndex: 239,
};

// agent.services
const AgentServiceEx = {
  ID: 'redis',
  Service: 'redis',
  Tags: [],
  TaggedAddresses: {
    lan: {
      address: '127.0.0.1',
      port: 8000,
    },
    wan: {
      address: '198.51.100.53',
      port: 80,
    },
  },
  Meta: {
    redis_version: '4.0',
  },
  Namespace: 'default',
  Port: 8000,
  Address: '',
  EnableTagOverride: false,
  Datacenter: 'dc1',
  Weights: {
    Passing: 10,
    Warning: 1,
  },
};

// health.service
const healthServiceDetailEx = {
  Node: {
    ID: '40e4a748-2192-161a-0510-9bf59fe950b5',
    Node: 'foobar',
    Address: '10.1.10.12',
    Datacenter: 'dc1',
    TaggedAddresses: {
      lan: '10.1.10.12',
      wan: '10.1.10.12',
    },
    Meta: {
      instance_type: 't2.medium',
    },
  },
  Service: {
    ID: 'redis',
    Service: 'redis',
    Tags: ['primary'],
    Address: '10.1.10.12',
    TaggedAddresses: {
      lan: {
        address: '10.1.10.12',
        port: 8000,
      },
      wan: {
        address: '198.18.1.2',
        port: 80,
      },
    },
    Meta: {
      redis_version: '4.0',
    },
    Port: 8000,
    Weights: {
      Passing: 10,
      Warning: 1,
    },
    Namespace: 'default',
  },
  Checks: [
    {
      Node: 'foobar',
      CheckID: 'service:redis',
      Name: "Service 'redis' check",
      Status: 'passing',
      Notes: '',
      Output: '',
      ServiceID: 'redis',
      ServiceName: 'redis',
      ServiceTags: ['primary'],
      Namespace: 'default',
    },
    {
      Node: 'foobar',
      CheckID: 'serfHealth',
      Name: 'Serf Health Status',
      Status: 'passing',
      Notes: '',
      Output: '',
      ServiceID: '',
      ServiceName: '',
      ServiceTags: [],
      Namespace: 'default',
    },
  ],
};

export type NodeCheckType = typeof CheckEx;
export type NodeServiceType = typeof AgentServiceEx;
export type AgentServiceType = Record<string, typeof AgentServiceEx>;
export type HealthServiceDetailType = typeof healthServiceDetailEx;
