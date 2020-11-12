import { Gitlab } from "@gitbeaker/node";
import { PipelineSchemaDefault } from "@gitbeaker/core/dist/types/services/Pipelines";
import { ProjectSchemaDefault } from "@gitbeaker/core/dist/types/services/Projects";
import { JobSchemaDefault } from "@gitbeaker/core/dist/types/services/Jobs";

let GITLAB_PROJECT_ID = process.env.GITLAB_PROJECT_ID;

if (!GITLAB_PROJECT_ID) {
  throw new Error("set env 312");
}

// type JOB_STATUS = "running" | "manual" | "success" | "created" | "pending";

let JOB_STATUS = {
  running: "running",
  manual: "manual",
  success: "success",
  created: "created",
  pending: "pending",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const api = new Gitlab({
  host: process.env.GITLAB_HOST,
  token: process.env.GITLAB_ACCESS_TOKEN,
});

let project: ProjectSchemaDefault = (await api.Projects.show(
  GITLAB_PROJECT_ID
)) as any;

if (!project) {
  throw Error("Project not found");
}

let ppl: PipelineSchemaDefault[] = (await api.Pipelines.all(project.id, {
  maxPages: 1,
  perPage: 3,
})) as any;

let [lastPipeline] = ppl;
console.log("lastPipeline:", lastPipeline);
if (!lastPipeline) {
  throw Error("Pipeline not found");
}

// let _ppl: PipelineSchemaDefault[] = (await api.Pipelines.show(
//   project.id,
//   lastPipeline.id
// )) as any;

let pipelineJobs: JobSchemaDefault[] = (await api.Jobs.showPipelineJobs(
  project.id,
  lastPipeline.id
)) as any;

// break;
let deploy_rc_job = pipelineJobs.find((__) => __.name === "deploy_rc");
console.log("deploy_rc_job", deploy_rc_job);

if (!deploy_rc_job) {
  throw Error("Job 'deploy_rc' not found");
}

if (deploy_rc_job.status === JOB_STATUS.success) {
  throw Error("Job is done");
}
if (deploy_rc_job.status === JOB_STATUS.running) {
  throw Error("Job is running");
}

if (lastPipeline.status === JOB_STATUS.success) {
  console.log("lastPipeline.status === JOB_STATUS.success");
  // .....
  throw Error("???????");
}
//
if (![JOB_STATUS.running, JOB_STATUS.pending].includes(lastPipeline.status)) {
  console.log("lastPipeline.status !== JOB_STATUS.running");
  throw Error("???????");
}

// Further only if lastPipeline.status === "running"
// 31
for (let index = 0; index < 30; index++) {
  console.log("element:", index, new Date().toUTCString());

  console.log("project.id:", project.id);
  console.log("deploy_rc_job.id:", deploy_rc_job.id);
  console.log("index", index);

  try {
    let play: JobSchemaDefault[] = (await api.Jobs.play(
      project.id,
      deploy_rc_job.id
    )) as any;
    console.log("play", play);
    break;
  } catch (e) {
    console.log("e:", e);
  }

  // if (index === 0) {
  //   break;
  // }
  await sleep(30000);
}
