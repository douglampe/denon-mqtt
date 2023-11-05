import { Orchestrator } from './Orchestrator';

(async () => {
  await Orchestrator.run();
})()
  .then()
  .catch((error) => {
    console.error(error);
  });
