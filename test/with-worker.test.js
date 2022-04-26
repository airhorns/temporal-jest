import { getWorker } from "../src/worker";
import { runAndAwaitExample } from "../src/client";
import { withWorker } from "./utils";

describe("withWorker", () => {
  test("it can run a worker that runs a workflow", async () => {
    const worker = await getWorker()
    await withWorker(worker, async () => {
      await runAndAwaitExample("a");
    })
  });

  test("it can repeatedly run a worker that runs a workflow", async () => {
    let worker = await getWorker()
    await withWorker(worker, async () => {
      await runAndAwaitExample("a");
    })

     worker = await getWorker()
    await withWorker(worker, async () => {
      await runAndAwaitExample("b");
      await runAndAwaitExample("c");
    })
  });
})