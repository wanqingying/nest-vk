import {
  Counter,
  Gauge,
  Histogram,
  collectDefaultMetrics,
  validateMetricName,
  MetricConfiguration,
  MetricObject,
  Registry,
} from 'prom-client';
import { EventEmitter } from 'node:events';
import dc from 'node:diagnostics_channel';
import { ClientRequest } from 'node:http';

type TagType = Record<string, string | number>;

export interface PromBody<R extends TagType = TagType> {
  name: string;
  help?: string;
  tags?: R;
  value: number;
}
export interface PromTiming {
  buckets?: number[];
  name: string;
  help?: string;
  tags?: string[];
}

export interface TimingData<T extends TagType, Q = any, A = any> {
  tags?: T;
  next?: (end: Function, req: Q, res: A) => void;
}

export type TapNext<T extends TagType, Q, A> = (
  end: (labels: T) => number,
  req: Q,
  res: A,
) => void;

// init
export class PromHelper extends EventEmitter {
  private static histograms = new Map<string, Histogram>();
  private static counters = new Map<string, Counter>();
  private static labels = new Map<string, string[]>();
  private static instance: PromHelper;
  public static registry: Registry = new Registry();
  public static logger = console;

  private constructor() {
    super();

    collectDefaultMetrics({
      labels: {},
    });
  }

  public static init(): PromHelper {
    if (!PromHelper.instance) {
      PromHelper.instance = new PromHelper();
    }
    return PromHelper.instance;
  }

  private static count<R extends TagType>(data: PromBody<R>): void {
    const { name, tags = {}, value } = data;
    const labelNames = Array.from(new Set(Object.keys(tags)));

    if (!PromHelper.counters.has(name)) {
      if (!validateMetricName(name)) {
        return PromHelper.logger.error(`Invalid prom metric name: ${name}`);
      }
      const metric = new Counter({
        name,
        help: `${name}_help`,
        labelNames,
      });
      this.registry.registerMetric(metric);
      PromHelper.counters.set(name, metric);
      PromHelper.labels.set(name, labelNames);
    }
    const counter = PromHelper.counters.get(name);
    const saveLabels = PromHelper.labels.get(name) || [];
    if (labelNames.some((item) => !saveLabels.includes(item))) {
      return PromHelper.logger.error(
        `tags should always have same keys, expected: ${saveLabels}, but got: ${labelNames}`,
      );
    }
    try {
      counter.inc(tags, value);
    } catch (e) {
      PromHelper.logger.error(e);
    }
  }
  public static counter<R extends TagType>(name: string, help?: string) {
    return (value: number, tags?: R) =>
      PromHelper.count({
        name,
        help,
        tags,
        value,
      });
  }

  private static histogram<T extends TagType>(
    data: PromTiming,
  ): Histogram | undefined {
    const { name, tags, help } = data;
    const labelNames = tags || [];

    if (!PromHelper.histograms.has(name)) {
      if (!validateMetricName(name)) {
        PromHelper.logger.error(`Invalid prom metric name: ${name}`);
        return;
      }
      const metric = new Histogram({
        name,
        help: help || `${name}_help`,
        labelNames,
      });
      this.registry.registerMetric(metric);
      PromHelper.histograms.set(name, metric);
      PromHelper.labels.set(name, labelNames);
    }
    const histogram = PromHelper.histograms.get(name);
    const saveLabels = PromHelper.labels.get(name) || [];
    if (labelNames.some((item) => !saveLabels.includes(item))) {
      PromHelper.logger.error(
        `tags should always have same keys, expected: ${saveLabels}, but got: ${labelNames}`,
      );
      //not throw error because metrics loss is not critical
      return;
    }
    return histogram;
  }
  public static observer<T extends TagType, Q = any, A = any>(
    name: string,
    keys: (keyof T)[] = [],
    help?: string,
    buckets?: number[],
  ) {
    return (next?: TapNext<T, Q, A>): MethodDecorator => {
      return (
        _target: object,
        _key: string,
        descriptor: TypedPropertyDescriptor<any>,
      ): any => {
        const _fn = descriptor.value! as Function;
        const histogram = PromHelper.histogram({
          name,
          help,
          buckets,
          tags: keys as string[],
        });
        descriptor.value = async function (this: any, ...args: any[]) {
          const fn = _fn.bind(this) as (...args: unknown[]) => Promise<A>;
          if (!histogram) return fn(...args);
          const end = histogram.startTimer();
          return Promise.resolve(fn(...args)).then((res) => {
            try {
              next ? next(end, args as Q, res) : end({});
            } catch (e) {
              PromHelper.logger.error(e);
            }
            return res;
          });
        };
        return descriptor;
      };
    };
  }
}

export const observer = PromHelper.observer;
export const counter = PromHelper.counter;

// ---- examples ----

export const ObserveFeature = observer<
  { method: 'get' | 'post'; req: string },
  [string],
  number
>('async_timing', ['method']);

export const ObserveHttp = observer<{ method: string; path: string }>(
  'http_request_duration',
  ['method', 'path'],
);

export const countTest = counter<{ method: string; path: string }>(
  'test_counter',
);

const countHttp = counter<{ method: string; path: string }>(
  'http_client_request_created',
);

