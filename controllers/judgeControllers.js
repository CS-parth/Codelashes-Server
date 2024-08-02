const { spawn } = require("child_process");
const fs = require('fs');
const util = require('util');
const { Queue, Worker } = require('bullmq');
const readFilePromise = util.promisify(fs.readFile);
const writeFilePromise = util.promisify(fs.writeFile);
const unlinkPromise = util.promisify(fs.unlink);
const readLine = require('readline');
const Stream = require('stream');
const Submission = require('../models/Submission');
const Problem = require("../models/Problem");
const { Testcase } = require('../models/Testcase');
const { fetchFileFromFirebase } = require("../config/firebase");
const {emitMessage,sendMessage, getRooms} = require("../utils/socket-io");
const Contest = require('../models/Contest');
const moment = require('moment');
const connection = {
  host: '127.0.0.1',
  port: '6379'
};

// Creating a queue
const executionQueue = new Queue('execution-queue', { connection });

const executionWorker = new Worker('execution-queue', async (job) => {
  const { username,contest,roomId, problem, code, jobId } = job.data;
  
  // check if the problem exists 
  const existingProblem = await Problem.findById(problem);
  if(existingProblem == null){
      throw new Error("Problem Id is Incorrect");
  }
  const newSubmission = new Submission({username,contest,problem,code,language:"C"});
  
  const contestId = contest;
  const existingContest = await Contest.findById(contestId);
  const contestEndTime = moment(existingContest.endDate,"ddd MMM DD YYYY HH:mm:ss GMT+HHMM");
  const contestStartTime = moment(existingContest.startDate,"ddd MMM DD YYYY HH:mm:ss GMT+HHMM");

  if (moment().isBefore(contestEndTime) && moment().isAfter(contestStartTime)){
    newSubmission.isRated = true;
  } else {
    newSubmission.isRated = false;
  }

  let compilationTimeStart;
  let compilationTimeEnd;
  let compilationTime;
  const fileName = `solution_${jobId}`;
  let areFilesRemoved = true;
  try {

    await writeFilePromise(`sandbox/${fileName}.c`, code);

    const writtenCode = fs.readFileSync(`sandbox/${fileName}.c`, 'utf-8');

  
    compilationTimeStart = Date.now();
    try{
      await spawnPromise('gcc', [`sandbox/${fileName}.c`, '-static', '-static-libgcc', '-static-libstdc++', '-o', `sandbox/${fileName}`]);
    }catch(err){
      const finalVerdict = "Compilation Error";
      const compilationTime = -1;
      return { message: 'Error in Compilation', compilationTime, finalVerdict, roomId };
    }
    compilationTimeEnd = Date.now();
    compilationTime = (compilationTimeEnd - compilationTimeStart) / 1000;

   
    const binaryStats = fs.statSync(`sandbox/${fileName}`);

    const Testcases = await Testcase.find({
      problem:`${problem}`
    });
    // const testcase = Testcases[0];
    let executionError = "";
    let finalVerdict = "";
    let finalTestcase = "";
    const processTestcases = async (array)=>{
      for(const testcase of array){
        let incorrectFlag = false;
        // console.log(testcase);
        await fetchFileFromFirebase(testcase.data.url,`./sandbox/${jobId}_${testcase.data.access_token}.txt`);
        await fetchFileFromFirebase(testcase.answer.url,`./sandbox/${jobId}_${testcase.answer.access_token}.txt`);
        const { outputFilePath, stderr, verdict } = await runDockerWithTimeout(fileName, 5000, `./sandbox/${jobId}_${testcase.data.access_token}.txt`, `./sandbox/${jobId}_${testcase.answer.access_token}.txt`); // 5 seconds timeout
        finalVerdict = verdict;
        if(finalVerdict != "Accepted"){
          incorrectFlag = true;
          const textcaseAsBuffer = await readFilePromise(`./sandbox/${jobId}_${testcase.data.access_token}.txt`);
          for(let charCode of textcaseAsBuffer){
            finalTestcase+=(String.fromCharCode(charCode));
          }
        }
        await unlinkPromise(outputFilePath).catch((err) => console.error("Cleanup error:", err));
        await unlinkPromise(`./sandbox/${jobId}_${testcase.data.access_token}.txt`).catch((err) => console.error("Cleanup error:", err));
        await unlinkPromise(`./sandbox/${jobId}_${testcase.answer.access_token}.txt`).catch((err) => console.error("Cleanup error:", err));
        if(incorrectFlag) break;
      }
    }
    await processTestcases(Testcases);
    console.log("Sandbox executed successfully");

    if (executionError.length) console.error(stderr);

    await Promise.all([unlinkPromise(`sandbox/${fileName}`),unlinkPromise(`sandbox/${fileName}.c`)]); 
    
    areFilesRemoved = false;
    newSubmission.verdict = finalVerdict;
    newSubmission.jobId = jobId;
    newSubmission.failedTestcase = finalTestcase;
    newSubmission.save();
    return { message: 'Successfully compiled and executed', compilationTime, finalVerdict, roomId, finalTestcase };

  } catch (err) {
    console.error("Error:", err);
    if(areFilesRemoved){
      await unlinkPromise(`sandbox/${fileName}.c`).catch((err) => console.error("Cleanup error:", err));
      await unlinkPromise(`sandbox/${fileName}`).catch((err) => console.error("Cleanup error:", err));
    }
    throw err;
  }
}, { connection }); // it's on auto run

executionWorker.on('completed', (job, result) => {
  sendMessage(result.roomId,"verdict",result);
  setTimeout(()=>{
    console.log(`Job ${job.id} completed successfully with result:`, result);
  },1000);
});
executionWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

exports.submitController = async (req, res) => {
  // Before adding the tasks to the queue make them into the submissions
  const jobId = `job-${Date.now()}`;
  try {
    const response = await executionQueue.add('execute', {
      username: req.body.username,
      contest: req.body.contest,
      roomId: req.body.roomId,
      problem: req.body.problem,
      code: req.body.code,
      jobId: jobId
    }); // add auto removals
    console.log(`Added JobId ${jobId} to the executionQueue`);
    return res.status(200).json({ message: "Job submitted successfully", jobId });
  } catch (err) {
    console.error("Error adding job to the queue:", err);
    return res.status(500).json({ error: "Failed to submit job" });
  }
};


const spawnPromise = (command, args, options) => {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, options);
    let stderr = '';

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code) => {
      if (code === 0) {
        resolve({ stderr });
      } else {
        reject(new Error(`Process exited with code ${code}: ${stderr}`));
      }
    });

    child.on('error', (err) => {
      reject(err);
    });
  });
};

const runDockerWithTimeout = (fileName, timeout, testcaseFile,answerFile) => {
  return new Promise((resolve, reject) => {
    const outputFilePath = `sandbox/output_${fileName}.txt`;
    const outputFile = fs.createWriteStream(outputFilePath);
    const child = spawn('sh', ['-c', `cat sandbox/${fileName} | docker run --runtime=runsc --rm -i --memory=256m --stop-timeout 3 \
                                                                --mount type=bind,source=${testcaseFile},target=/testcase.txt,readonly \
                                                                --mount type=bind,source=${answerFile},target=/answer.txt \
                                                                sandbox_test:latest /sandbox /testcase.txt /answer.txt`]);
    let stderr = '';
    let streamClosed = false;
    let verdict = '';
    const closeStream = () => {
      if (!streamClosed) {
        streamClosed = true;
        outputFile.close();
      }
    };
    const getLastLine = (fileName,minLength,kthline) => {
      let inputSream = fs.createReadStream(fileName);
      let outputStream = new Stream;
      return new Promise((resolve,reject)=>{
          let rl = readLine.createInterface(inputSream,outputStream);
          let lastLine = '';
          let k = 0;
          rl.on('line',(line)=>{
            if (line.length >= minLength) {
              lastLine = line;
              k++;
            }
            if(k == kthline) rl.close();
          })
          rl.on('error', reject)

          rl.on('close',()=>{
            resolve(lastLine);
          })
      })
    }

    const handleVerdict = (signal) => {
      signal = parseInt(signal);
      switch (signal) {
        case 0:
          verdict = "Accepted"
          break;
        case 2000:
          verdict = "Wrong Answer"
          break;
        case 15:
          verdict = "Time Limit Excceded"
          break;
        case 11:
          verdict = "Runtime Error"
          break      
        default:
          verdict = "Unknown Error"
          break;
      }  
    }
    
    child.stdin.end();
    
    child.stdout.pipe(outputFile);

    child.stderr.on('data', (data) => {
      stderr += data;
    });

    child.on('close', (code,signal) => { // after 2s it will automatically complete due to the sandbox.c
      closeStream();
      getLastLine(outputFilePath,1,2)
                .then((lastline)=>{
                  console.log(lastline);
                  handleVerdict(lastline);
                })
                .catch((err)=>{
                  handleVerdict(-1);
                  console.error(err)
                })
                .then(()=>{
                  if (code === 0) {
                    resolve({ outputFilePath, stderr, verdict });
                  } else {
                    reject(new Error(`Process exited with code ${code}: ${stderr}`));
                  }
                })
    });

    child.on('error', (err) => {
      closeStream();
      reject(err);
    });
  });
};

