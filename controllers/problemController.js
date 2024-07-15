const Problem = require("../models/Problem");
const { Testcase } = require("../models/Testcase");
const { uploadToFirebase, removeFromFirebase, fetchFileFromFirebase, genUniqueFileName }  = require('../config/firebase');
const { getFileName } = require('../config/firebase');
const AdmZip = require("adm-zip");
const { promises: fs } = require('fs');
const path = require('path');
const util = require('util');
const moment = require('moment');
const extractZip = (filepath,outputpath) => {
    return new Promise((resolve,reject)=>{
        const zip = new AdmZip(filepath);
        zip.extractAllToAsync(outputpath,true,(err)=>{
            if(err){
                reject(err);
            }else{
                resolve();
            }
        })
    })
}
exports.createProblem = async (req,res) => {

    let testcaseUrls = [];
    let answerUrls = [];
    let extractPath;
    try{
        const testcaseZip = req.files.testcase[0];
        const answerZip = req.files.answer[0];
        // console.log(testcaseZip);
        const data = await JSON.parse(req.body.data);
        const { problemStatement, constraints, input, output, sampleTestcase, time, memory, title, acceptance , difficulty } = data;
        const newProblem = new Problem({problemStatement,constraints,input,output,sampleTestcase,time,memory,title,acceptance,difficulty});
        extractPath = path.join(__dirname,"..","storage",Date.now().toString());
        console.log(extractPath);
        // return;
        fs.mkdir(extractPath,{recursive: true});
        const testcaseExtractPath = path.join(extractPath,'testcases_kartoos');
        const answerExtractPath = path.join(extractPath,'answers_kartoos');
        // Unzip them

        await extractZip(testcaseZip.path,testcaseExtractPath); // making them async
        await extractZip(answerZip.path,answerExtractPath); 

        // setTimeout(async ()=>{
        const [testcaseFiles,answerFiles] = await Promise.all([
            fs.readdir(path.join(testcaseExtractPath,testcaseZip.fieldname)),
            fs.readdir(path.join(answerExtractPath,answerZip.fieldname))
        ]);
        if(testcaseFiles.length != answerFiles.length){
            return res.status(403).json({message:"Mismatch in the testcases and answers"});
        }
        const testcasePromises = testcaseFiles.map(async (file,index)=>{
                                    const fileName = genUniqueFileName();
                                    const testcaseFile = await uploadToFirebase(path.join(testcaseExtractPath,testcaseZip.fieldname,testcaseFiles[index]),`Problem-testcases/${fileName}_testcase_${index}.txt`);
                                    testcaseUrls.push(testcaseFile.fileUrl);
                                    const answerFile = await uploadToFirebase(path.join(answerExtractPath,answerZip.fieldname,answerFiles[index]),`Problem-answers/${fileName}_answer_${index}.txt`);
                                    answerUrls.push(answerFile.fileUrl);
                                    const newTestcase = new Testcase({
                                        data: {
                                            url: testcaseFile.fileUrl,
                                            access_token: testcaseFile.uuid
                                        },
                                        answer: {
                                            url: answerFile.fileUrl,
                                            access_token: answerFile.uuid
                                        },
                                        problem: newProblem._id
                                    });
                                    console.log(newTestcase);
                                    return newTestcase.save();
                                })
        await Promise.all(testcasePromises);

        // console.log(newProblem);
        await newProblem.save();
        if (extractPath) {
            await fs.rm(extractPath, { recursive: true, force: true }).catch(console.error);
        }
        res.status(200).json({message: `Problem created successfully with id: ${newProblem._id}`});
        // },5000)

    }catch(err){
        const removeTestcasePromises = testcaseUrls.map((url)=>{
            return removeFromFirebase(url);
        })
        await Promise.all(removeTestcasePromises);
        const removeAnswerPromises = answerUrls.map((url)=>{
            return removeFromFirebase(url);
        })
        await Promise.all(removeAnswerPromises);
        if (extractPath) {
            await fs.rm(extractPath, { recursive: true, force: true }).catch(console.error);
        }
        res.status(400).send(`${err}`);
    }
}

exports.getProblem = async (req, res) => {
    try {
        const id = req.params.id;
        
        if (!id) {
            return res.status(400).json({ message: "Invalid problem ID" });
        }

        const existingProblem = await Problem.findById(id);
        
        if (!existingProblem) {
            return res.status(404).json({ message: "Problem does not exist" });
        }
        
        res.status(200).json(existingProblem);
    } catch (error) {
        console.error('Error retrieving problem:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}

exports.getProblemList = async (req, res) => {
    try {
        const allProblems = await Problem.find({},'_id number title acceptance difficulty contest')
                                         .populate({
                                            path: 'contest',
                                            select: 'startDate endDate duration'
                                         })
                                         .exec();
        
        if (!allProblems) {
            return res.status(404).json({ message: "No problems to pesent" });
        }
        const filteredProblems = allProblems.filter((problem)=>{
            if(!problem.contest) return true;
            
            const contestEndTime = moment(problem.contest.endDate);
            
            return moment().isAfter(contestEndTime);
        })
        res.status(200).json(filteredProblems);
    } catch (error) {
        console.error('Error retrieving problem:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}