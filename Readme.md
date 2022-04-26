Reproduction for shutdown errors occurring when running temporal under jest

There's two test files in this repo:
 - `with-worker.test.js` that tests the `withWorker` helper from the TypeScript SDK
 - `complete-open.test.js` which tests a utility for starting a worker to run all the open workflows that userland code might have added with a client.

To run one test file to show that it works:

```
yarn run jest --runInBand test/with-worker.test.js
```

The other test file is flakey, where one of the test times out every 4-5 runs for me:

```
yarn run jest --runInBand test/complete-open.test.js
```

This flake may or may not be related, but seems strange!

The main issue that this repo reproduces is a consistent `ShutdownError: Core is shut down` error or `ShutdownError: Core is shut down and there are no more workflow replay tasks` that happens when running both tests at once:

```
yarn run jest --runInBand
```

Note that the `--runInBand` flag is necessary to run the tests one at a time so they don't stomp on each other's workflows. I see the same behaviour with `--maxWorkers=1` as well.

Another maybe important thing that hasn't made much of a difference for me is explicitly or implicitly letting the `Runtime` shutdown. There's an explicit `Runtime.instance().shutdown()` call in the `jest.setup.js` file right now, but I don't see any change in behaviour with that in place or absent, and it seems like the TypeScript SDK tests test that the Runtime can be stopped and started repeatedly. Without the explicit shutdown call, the node.js process never exits automatically as there is an open handle somewhere. Adding the jest `--forceExit` flag or explicitly shutting down the runtime fixes this.