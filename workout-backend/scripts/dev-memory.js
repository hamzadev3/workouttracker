// Runs the API against a throwaway in-memory MongoDB, so you can try the app
// without installing MongoDB or using Atlas. All data is lost when you stop it.
// Usage: npm run dev:memory
const { spawn } = require("child_process");
const path = require("path");
const { MongoMemoryServer } = require("mongodb-memory-server");

(async () => {
  const mongo = await MongoMemoryServer.create();
  console.log("In-memory MongoDB started");

  const api = spawn(process.execPath, [path.join(__dirname, "..", "server.js")], {
    env: { ...process.env, MONGO_URI: mongo.getUri("workouts") },
    stdio: "inherit",
  });

  const stop = async () => {
    api.kill();
    await mongo.stop();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  api.on("exit", stop);
})();
