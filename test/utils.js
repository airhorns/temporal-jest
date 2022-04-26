import pMap from "p-map";
import { client, connection } from "../src/client";
import { getWorker } from "../src/worker";

export async function withWorker(worker, fn) {
  const runAndShutdown = async () => {
    try {
      return await fn();
    } finally {
      worker.shutdown();
    }
  };
  const [_, ret] = await Promise.all([worker.run(), runAndShutdown()]);
  return ret;
}

export const getOpenWorkflowExecutionHandles = async () => {
  const { executions } = await connection.service.listOpenWorkflowExecutions({ namespace: "temporal-jest-reproduction" });
  return executions.map((execution) => client.getHandle(execution.execution.workflowId));
};

/**
 * Find and work off any open workflows in Temporal.
 * Test helper, shouldn't be used in production code.
 **/
export const completeOpenWorkflows = async () => {
  const handles = await getOpenWorkflowExecutionHandles();
  if (handles.length > 0) {
    // start and run a worker until all the workflow executions we're looking for are complete
    const worker = await getWorker();
    await withWorker(worker, async () => {
      const results = await pMap(handles, async (handle) => await handle.result());
      return results;
    });
  }
};

/**
 * Find and delete any open workflows in Temporal (without completing them)
 * Test helper, shouldn't be used in production code.
 **/
 export const terminateOpenWorkflows = async () => {
  await pMap(await getOpenWorkflowExecutionHandles(), async (handle) => await handle.terminate());
};
