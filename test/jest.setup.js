import { Runtime } from "@temporalio/worker";
import { connection } from "../src/client";
import { terminateOpenWorkflows } from "./utils";

const jestConsole = console;

beforeEach(async () => {
  global.console = require('console');
  await terminateOpenWorkflows();
  console.log(`starting test "${expect.getState().currentTestName}"`);
});

afterEach(() => {
  global.console = jestConsole;
});

afterAll(async () => {
  connection.client.close();
  await Runtime.instance().shutdown();
})