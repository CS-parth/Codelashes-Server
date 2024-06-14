const { spawn } = require("child_process");
const fs = require('fs');
const util = require('util');
const { Queue, Worker } = require('bullmq');
const writeFilePromise = util.promisify(fs.writeFile);
const unlinkPromise = util.promisify(fs.unlink);
const readLine = require('readline');
const Stream = require('stream');
const connection = {
  host: '127.0.0.1',
  port: '6379'
};

// Creating a queue
const executionQueue = new Queue('execution-queue', { connection });

const executionWorker = new Worker('execution-queue', async (job) => {
  const { code, jobId } = job.data;
  console.log(code);

  let compilationTimeStart;
  let compilationTimeEnd;
  let compilationTime;
  const fileName = `solution_${jobId}`;

  try {

    await writeFilePromise(`sandbox/${fileName}.c`, code);
    console.log(`Code written successfully to the file ${fileName}.c`);

    const writtenCode = fs.readFileSync(`sandbox/${fileName}.c`, 'utf-8');
    console.log(`Written Code: ${writtenCode}`);

  
    compilationTimeStart = Date.now();
    await spawnPromise('gcc', [`sandbox/${fileName}.c`, '-static', '-static-libgcc', '-static-libstdc++', '-o', `sandbox/${fileName}`]);
    compilationTimeEnd = Date.now();
    compilationTime = (compilationTimeEnd - compilationTimeStart) / 1000;
    console.log("Compilation Time:", compilationTime);
    console.log("Code compiled successfully");

   
    const binaryStats = fs.statSync(`sandbox/${fileName}`);
    console.log(`Binary Size: ${binaryStats.size} bytes`);

    
    const { outputFilePath, stderr, verdict } = await runDockerWithTimeout(fileName, 5000); // 5 seconds timeout

    console.log("Sandbox executed successfully");
    if (stderr) console.error(stderr);

   
    await unlinkPromise(`sandbox/${fileName}`);
    await unlinkPromise(`sandbox/${fileName}.c`);

    return { message: 'Successfully compiled and executed', compilationTime, outputFilePath , verdict };

  } catch (err) {
    console.error("Error:", err);

  
    await unlinkPromise(`sandbox/${fileName}.c`).catch((err) => console.error("Cleanup error:", err));
    await unlinkPromise(`sandbox/${fileName}`).catch((err) => console.error("Cleanup error:", err));
    await unlinkPromise(outputFile).catch((err) => console.error("Cleanup error:", err));
    throw err;
  }
}, { connection }); // it's on auto run

executionWorker.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed successfully with result:`, result);
});
executionWorker.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed with error: ${err.message}`);
});

exports.submitController = async (req, res) => {
  // Before adding the tasks to the queue make them into the submissions 
  const jobId = `job-${Date.now()}`;
  try {
    const response = await executionQueue.add('execute', {
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


const runDockerWithTimeout = (fileName, timeout) => {
  return new Promise((resolve, reject) => {
    const outputFilePath = `sandbox/output_${fileName}.txt`;
    const outputFile = fs.createWriteStream(outputFilePath);
    const child = spawn('sh', ['-c', `cat sandbox/${fileName} | docker run --runtime=runsc --rm -i --memory=256m --stop-timeout 3 sandbox_test:latest`]);
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
        case 1:
          verdict = "Wrong Answer"
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

