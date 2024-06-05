const { exec, execFile } = require("child_process")
const fs = require('fs');
const util = require('util');

const writeFilePromise = util.promisify(fs.writeFile);
const execPromise = util.promisify(exec);

exports.submitController = async (req,res)=>{
    // const { problem , code , language } = req.body;
    const { code } = req.body;
    console.log(code);

    // disallow all the modifications to sandbox.c
    // try{
    //     await execPromise('chmod 000 sandbox/sandbox.c');
    // }catch(err){
    //     console.error(err);
    // }

    // Code Using Promises instead of Callback hell
    writeFilePromise('sandbox/solution.c',code)
      .then(()=>{
        console.log("Code Written Successfully to the file sandbox.c");
        return execPromise('gcc sandbox/solution.c -static -static-libgcc -static-libstdc++ -o sandbox/solution'); // returing a promise
      })
      .then(()=>{
        console.log("Code Compiled Successfully");
        return execPromise('cat sandbox/solution | docker run --runtime=runc --rm -i sandbox_test:latest'); // code piped with the spinned sandbox
      })
      .then(({stderr,stdout})=>{
        console.log("Sandbox Spinned Successfully");
        if(stderr) console.error(stderr);
        else console.log(stdout)
      })
      .catch(err=>{
        console.error("ERROR :", err);
      })
      .finally(()=>{
          res.status(200).json({"message": "Successfully Compiled"});
      })
}