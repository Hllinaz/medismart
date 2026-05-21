// prisma/run-reassignment-queue.ts

import { processReassignmentQueue } from "../lib/reassignmentQueue";

async function main() {
  const results = await processReassignmentQueue();
  console.log(results);
}

main();