import { startExample } from "../src/client";
import { completeOpenWorkflows } from "./utils";

describe("complete-open", () => {
  test("can run when there are no open workflows", async () => {
    await completeOpenWorkflows();
  });

  test("can complete one workflow", async () => {
    const handle = await startExample("Temporal");
    await completeOpenWorkflows();
    expect(await handle.result()).toMatchInlineSnapshot(`"Hello, Temporal!"`);
  })

  test("can complete many workflows", async () => {
    const handles = await Promise.all([startExample("A"), startExample("B"), startExample("C")]);
    await completeOpenWorkflows();
    await Promise.all(handles.map(handle => handle.result()));
  })

  test("can repeatedly complete workflows", async () => {
    let handle = await startExample("A");
    await completeOpenWorkflows();
    expect(await handle.result()).toMatchInlineSnapshot(`"Hello, A!"`);

     handle = await startExample("B");
    await completeOpenWorkflows();
    expect(await handle.result()).toMatchInlineSnapshot(`"Hello, B!"`);

    handle = await startExample("C");
    await completeOpenWorkflows();
    expect(await handle.result()).toMatchInlineSnapshot(`"Hello, C!"`);
  })
})