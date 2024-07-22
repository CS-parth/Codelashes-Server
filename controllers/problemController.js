const Problem = require("../models/Problem");
const { Testcase } = require("../models/Testcase");
const { uploadToFirebase, removeFromFirebase, fetchFileFromFirebase, genUniqueFileName }  = require('../config/firebase');
const { getFileName } = require('../config/firebase');
const AdmZip = require("adm-zip");
const { promises: fs } = require('fs');
const path = require('path');
const util = require('util');
const moment = require('moment');
const Submission = require("../models/Submission");
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
        const {problemStatement, constraints, input, output, sampleTestcase, time, memory, title, acceptance , difficulty, contest} = data;
        const newProblem = new Problem({problemStatement,constraints,input,output,sampleTestcase,time,memory,title,acceptance,difficulty,contest});
        extractPath = path.join(__dirname,"..","storage",Date.now().toString());
        // console.log(extractPath);
        // return;
        fs.mkdir(extractPath,{recursive: true});
        const testcaseExtractPath = path.join(extractPath,'testcases_kartoos');
        const answerExtractPath = path.join(extractPath,'answers_kartoos');
        // Unzip them
        await extractZip(testcaseZip.path,testcaseExtractPath); // making them async
        await extractZip(answerZip.path,answerExtractPath); 

        // setTimeout(async ()=>{
        const [testcaseFiles,answerFiles] = await Promise.all([
            fs.readdir(path.join(testcaseExtractPath,testcaseZip.originalname.split(".")[0])),
            fs.readdir(path.join(answerExtractPath,answerZip.originalname.split(".")[0]))
        ]);
        if(testcaseFiles.length != answerFiles.length){
            return res.status(403).json({message:"Mismatch in the testcases and answers"});
        }
        const testcasePromises = testcaseFiles.map(async (file,index)=>{
                                    const fileName = genUniqueFileName();
                                    const testcaseFile = await uploadToFirebase(path.join(testcaseExtractPath,testcaseZip.originalname.split(".")[0],testcaseFiles[index]),`Problem-testcases/${fileName}_testcase_${index}.txt`);
                                    testcaseUrls.push(testcaseFile.fileUrl);
                                    const answerFile = await uploadToFirebase(path.join(answerExtractPath,answerZip.originalname.split(".")[0],answerFiles[index]),`Problem-answers/${fileName}_answer_${index}.txt`);
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
                                    // console.log(newTestcase);
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
        console.error(err);
        res.status(400).json({message: "Internal Server Error"});
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
        const { username } = req.query;
        console.log(username);
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
            const contestEndTime = moment(problem.contest.endDate,"ddd MMM DD YYYY HH:mm:ss Z+HHmm");
            if(moment().isAfter(contestEndTime)){
                return true;
            }
        })
        let filteredProblemsWithStatus;
        if(username){
            filteredProblemsWithStatus = await Promise.all(filteredProblems.map(async (problem) => {
                const isAccepted = await Submission.findOne({
                    username: username, 
                    verdict: "Accepted", 
                    problem: problem._id
                });
                return {
                    ...problem,
                    status: isAccepted ? "solved" : "attempted"
                };
            }));
            const result = filteredProblemsWithStatus.map(problem => ({
                ...problem._doc,
                status: problem.status
            }));
            filteredProblemsWithStatus = result;
        }
        console.log(filteredProblemsWithStatus);
        res.status(200).json(filteredProblemsWithStatus);
    } catch (error) {
        console.error('Error retrieving problem:', error);
        res.status(500).json({ message: "Internal server error" });
    }
}