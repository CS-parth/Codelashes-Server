const { exec, execFile } = require("child_process")
const fs = require('fs');
const util = require('util');
const { Queue, Worker } = require('bullmq');
const writeFilePromise = util.promisify(fs.writeFile);
const execPromise = util.promisify(exec);

// const connection = new IORedis();

const connection = {
  'host' : '127.0.0.1',
  'port' : '6379'
}
// creating a queue
const executionQueue = new Queue('execution-queue', { connection });

const executionWorker = new Worker('execution-queue', async (job)=>{
  const { code,jobId}  = job.data;
  console.log(code);
  // First Save it as a Submission
  // disallow all the modifications to sandbox.c
  // try{
  //     await execPromise('chmod 000 sandbox/sandbox.c');
  // }catch(err){
  //     console.error(err);
  // }
  let compilationTimeStart;
  let compilationTimeEnd;
  let compilationTime;
  // Code Using Promises instead of Callback hell
  writeFilePromise(`sandbox/solution_${jobId}.c`,code)
    .then(()=>{
      console.log(`Code Written Successfully to the file solution_${jobId}.c`);
      compilationTimeStart = Date.now();
      return execPromise(`gcc sandbox/solution_${jobId}.c -static -static-libgcc -static-libstdc++ -o sandbox/solution_${jobId}`); // returing a promise
    })
    .then(()=>{
      compilationTimeEnd =  Date.now();
      compilationTime = (compilationTimeEnd-compilationTimeStart)/1000;
      compilationTime = null;
      compilationTimeStart = null;
      compilationTimeEnd = null;
      console.log("Compilation Time : ", compilationTime)
      console.log("Code Compiled Successfully");
      return execPromise(`cat sandbox/solution_${jobId} | docker run --runtime=runc --rm -i sandbox_test:latest`); // code piped with the spinned sandbox
    })
    .then(({stderr,stdout})=>{
      console.log("Sandbox Spinned Successfully");
      if(stderr) console.error(stderr);
      else console.log(stdout)
      // performing a clean-up
      execPromise(`rm sandbox/solution_${jobId}.c`)
      .then(()=>{
        exec(`rm sandbox/solution_${jobId}`)
      })
      .catch((err)=>{
        console.error("Unable to perform cleanup", err);
      })
    })
    .catch(err=>{
      // performing a clean-up
      execPromise(`rm sandbox/solution_${jobId}.c`)
      .then(()=>{
        exec(`rm sandbox/solution_${jobId}`)
      })
      .catch((err)=>{
        console.error("Unable to perform cleanup", err);
      })
      console.error("ERROR :", err);
    })
    .finally(()=>{
        return { message: 'Successfully Compiled' };
    })

}, { connection }); // its on auto run


executionWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully with result:`, result);
});
executionWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

exports.submitController = async (req,res)=>{
  // before adding the tasks to the queue make them into the submitions 
  const jobId = `job-${Date.now()}`;
  const response = await executionQueue.add('execute',{
    code : req.body.code,
    jobId : jobId
  }) // add auto removals
  console.log(`Added  JobId ${jobId} to the executionQueue`);
  console.log(response);
  return res.status(200).json({message: "Bebo mai bebo"});
}