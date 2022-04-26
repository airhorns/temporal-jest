import { bundleWorkflowCode, NativeConnection, Worker } from "@temporalio/worker";
import { DefaultLogger, Runtime } from "@temporalio/worker";
import fse from "fs-extra";
import pMemoize from "p-memoize";
import path from "path";
import * as activities from "./activities";

Runtime.install({
  logger: new DefaultLogger("DEBUG", (entry) => console.log("[worker] ", entry.message, entry.meta)),
  telemetryOptions: {
    tracingFilter: `temporal_sdk_core=DEBUG`,
    logForwardingLevel: "DEBUG",
  },
});

export const cachedBundlePath = path.join(__dirname, "temporal-worker-bundle.js");

export const writeCachedWorkflowBundle = async () => {
  const bundle = await buildNewWorkflowBundle();
  await fse.writeFile(cachedBundlePath, bundle.code);
  return bundle
};

const buildNewWorkflowBundle = async () => {
  return await bundleWorkflowCode({
    workflowsPath: require.resolve("./workflows"),
  });
};

// Only build the workflow code once per process by memoizing the bundle step
// TODO: build this once inside the docker container build step instead of dynamically at runtime
const getWorkflowBundle = pMemoize(async () => {
  if (await fse.pathExists(cachedBundlePath)) {
    return { path: cachedBundlePath };
  } else {
    return await writeCachedWorkflowBundle();
  }
});

/** Logs Activity executions and their duration */
export class ActivityInboundLogInterceptor {
  
  constructor(ctx) {
    this.ctx = ctx
  }
  
  async execute(input, next) {
    let error = undefined;
    const startTime = process.hrtime.bigint();
    try {
      return await next(input);
    }
    catch (err) {
      error = err;
      throw err;
    }
    finally {
      const durationNanos = process.hrtime.bigint() - startTime;
      const durationMs = Number(durationNanos / 1000000n);
      if (error) {
        console.error('[activity] activity failed', { error, durationMs });
      }
      else {
        console.debug('[activity] activity completed', { durationMs });
      }
    }
  }
}

/**
 * Return a new temporal worker
 * The caller is responsible for shutting down the worker on server close.
 **/
export const getWorker = async (taskQueue = "default") => {
  const baseOptions = {
    connection: await NativeConnection.create({ address: "127.0.0.1:7233" }),
    namespace: "temporal-jest-reproduction",
    workflowBundle: await getWorkflowBundle(),
    activities,
    taskQueue,
    interceptors: {
      activityInbound: [
        (ctx) => new ActivityInboundLogInterceptor(ctx),
      ],
    },
  };

  const worker = await Worker.create(baseOptions);
  return worker;
};
