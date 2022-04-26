import { Connection, WorkflowClient } from "@temporalio/client";
import { example } from "./workflows";
import { nanoid } from "nanoid";

export const connection = new Connection({
  address: "127.0.0.1:7233"
});

export const client = new WorkflowClient(connection.service, {
  namespace: "temporal-jest-reproduction"
});

export const startExample = async (name) => {
  const handle = await client.start(example, {
    args: [name], 
    taskQueue: "default",
    workflowId: "workflow-" + nanoid(),
  });
  console.log(`[test] Started workflow ${handle.workflowId}`);
  return handle;
};

export const runAndAwaitExample = async (name) => {
  const handle = await startExample(name);
  const result = await handle.result();
  console.log(`[test] Workflow ${handle.workflowId} completed with result: ${result}`);
  return result;
}
