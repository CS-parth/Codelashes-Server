const Problem = require("../models/Problem");
const { Testcase } = require("../models/Testcase");
const { uploadToFirebase, removeFromFirebase, fetchFileFromFirebase, genUniqueFileName }  = require('../config/firebase');
const { getFileName } = require('../config/firebase');
const AdmZip = require("adm-zip");
const { promises: fs } = require('fs');
const path = require('path');
const moment = require('moment');
const Submission = require("../models/Submission");
const Contest = require("../models/Contest");
const User = require("../models/User");
const validation = require("../utils/Validation");
const Editorial = require("../models/Editorial");
const Validation = new validation();

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
        const {problemStatement, constraints, input, output, sampleTestcase, time, memory, title, acceptance , difficulty, contest,username} = data;
        const setter = await User.findOne({username:username});
        const newProblem = new Problem({problemStatement,constraints,input,output,sampleTestcase,time,memory,title,acceptance,difficulty,contest,setter:setter._id});
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

exports.editProblem = async (req,res) => {
    let testcaseUrls = [];
    let answerUrls = [];
    let extractPath;
    try{
        const {id} = req.params;
        
        const testcaseZip = req.files.testcase[0];
        const answerZip = req.files.answer[0];
        // console.log(testcaseZip);
        const data = await JSON.parse(req.body.data);
        const {problemStatement, constraints, input, output, sampleTestcase, time, memory, title, difficulty } = data;
        const existingProblem = await Problem.findByIdAndUpdate(
            id,
            {
                problemStatement,
                constraints,
                input,
                output,
                sampleTestcase,
                time,
                memory,
                title,
                difficulty
            },
            { new: true, runValidators: true }
        );
        
        
        // Removing the aasociated testcases from firebase
        const associatedTestcases = await Testcase.find({problem:id});
        testcaseUrls = associatedTestcases.map((testcase)=>testcase.data.url);
        answerUrls = associatedTestcases.map((testcase)=>testcase.answer.url);
        const removeTestcasePromises = testcaseUrls.map((url)=>{
            return removeFromFirebase(url);
        })
        await Promise.all(removeTestcasePromises);
        const removeAnswerPromises = answerUrls.map((url)=>{
            return removeFromFirebase(url);
        })
        await Promise.all(removeAnswerPromises);
        // Removing testcases from database
        await Testcase.deleteMany({problem:id});
        // Adding the newTestcases 
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
                                        problem: existingProblem._id
                                    });
                                    // console.log(newTestcase);
                                    return newTestcase.save();
                                })
        await Promise.all(testcasePromises);

        // console.log(newProblem);
        // await newProblem.save();
        if (extractPath) {
            await fs.rm(extractPath, { recursive: true, force: true }).catch(console.error);
        }
        res.status(200).json({message: `Problem updated successfully with id: ${existingProblem._id}`});
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

exports.deleteProblem = async (req,res) => {
    try{
        const {id} = req.params;
        // Delete The associated testcases 
        let testcaseUrls = [];
        let answerUrls = [];
        // Removing the aasociated testcases from firebase
        const associatedTestcases = await Testcase.find({problem:id});
        testcaseUrls = associatedTestcases.map((testcase)=>testcase.data.url);
        answerUrls = associatedTestcases.map((testcase)=>testcase.answer.url);
        const removeTestcasePromises = testcaseUrls.map((url)=>{
            return removeFromFirebase(url);
        })
        await Promise.all(removeTestcasePromises);
        const removeAnswerPromises = answerUrls.map((url)=>{
            return removeFromFirebase(url);
        })
        await Promise.all(removeAnswerPromises);
        // Removing testcases from database
        await Testcase.deleteMany({problem:id});
        // Delete the problem
        await Problem.findByIdAndDelete(id);
        res.status(200).json({message:`Problem deleted Successfully with id ${id}`});
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
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
        const token = req.cookies.jwt;
        const user = await Validation.getUser(token);
        const username = user?.username;

        const allProblems = await Problem.find({}, '_id number title acceptance difficulty contest editorial')
            .populate({
                path: 'contest',
                select: 'startDate endDate duration'
            })
            .lean()
            .exec();

        if (!allProblems.length) {
            return res.status(404).json({ message: "No problems to present" });
        }

        const filteredProblems = allProblems.filter(problem => {
            if (!problem.contest) return true;
            const contestEndTime = moment(problem.contest.endDate, "ddd MMM DD YYYY HH:mm:ss GMT+HHMM");
            return moment().isAfter(contestEndTime);
        });

        let problemsWithStatus = filteredProblems;
        if (username) {
            const problemIds = filteredProblems.map(p => p._id);
            const userSubmissions = await Submission.find({
                username: username,
                problem: { $in: problemIds }
            }, 'problem verdict').lean();

            const submissionMap = new Map();
            userSubmissions.forEach(sub => {
                if (!submissionMap.has(sub.problem.toString()) || sub.verdict === "Accepted") {
                    submissionMap.set(sub.problem.toString(), sub.verdict);
                }
            });
            // console.log(filteredProblems);
            problemsWithStatus = filteredProblems.map(problem => ({
                ...problem,
                status: submissionMap.get(problem._id.toString()) === "Accepted" ? "Solved" :
                        submissionMap.has(problem._id.toString()) ? "Attempted" : "Unattempted"
            }));
        }

        // Apply filters
        const { status, difficulty, acceptance } = req.query;
        let filteredResults = problemsWithStatus;

        if (status) {
            filteredResults = filteredResults.filter(problem => problem.status === status);
        }
        if (difficulty) {
            filteredResults = filteredResults.filter(problem => problem.difficulty === difficulty);
        }
        if (acceptance) {
            filteredResults = filteredResults.filter(problem => 
                acceptance === "lesser" ? problem.acceptance <= 50 : problem.acceptance > 50
            );
        }
        // console.log(filteredResults);
        res.status(200).json(filteredResults);
    } catch (error) {
        console.error('Error retrieving problems:', error);
        res.status(500).json({ message: "Internal server error" });
    }
};

exports.getManagable = async (req,res)=>{
    try{
        const {username,contestId} = req.query;
        // get Question of this contest
        const contest = await Contest.findById(contestId)
                                     .populate({
                                        path:'problems',
                                        populate:{
                                            path:'setter'
                                        }
                                     });
        const contestProblems = contest.problems;
        const settersProblem = contestProblems.filter((problem)=>{
                                    return problem.setter.username == username;
                               })
        return res.status(200).json(settersProblem);
    }catch(err){
        console.log(err);
        return res.status(500).json({message: "Internal Server Error"});
    }   
}

exports.addEditorial = async (req,res) => {
    try{
        const {id} = req.params;
        const {language,code,solution} = req.body;
        console.log(solution);
        console.log(id);
        const existingEditorial = await Editorial.findOne({problem:id});
        console.log(existingEditorial);
        if(existingEditorial){
           return res.status(403).json({message: "Editorial to this problem already exists"});
        }
        const newEditorial = new Editorial({language,code,solution,problem:id});
        newEditorial.save();
        console.log(newEditorial);
        res.status(200).send(newEditorial);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

exports.getEditorial = async (req,res) => {
    try{
        const {id} = req.params;
        const existingEditorial = await Editorial.findOne({problem:id})
                                                 .populate({
                                                    path:'problem',
                                                    select:'contest',
                                                    populate: {
                                                        path: 'contest',
                                                        select: 'endDate'
                                                    }
                                                 })
        // the editorial should be server after the contest end time
        if(!existingEditorial){
           return res.status(404).json({message: "No Editorial Available"});
        }
        const contestEndTime = moment(existingEditorial.problem.contest.endDate,"ddd MMM DD YYYY HH:mm:ss GMT+HHMM");
        if(moment().isAfter(contestEndTime)){
            res.status(200).send({editorial:existingEditorial,success:true});
        }else{
            res.status(200).send({editorial: null,success:false})
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}

exports.getProblemCount = async (req,res) =>{
    try{
        const { username } = req.query;
        const problemCount = await Submission.aggregate([
            {
              '$match': {
                'username': `${username}`, 
                'verdict': 'Accepted'
              }
            }, {
              '$group': {
                '_id': '$problem'
              }
            }, {
              '$count': 'problemCount'
            }
          ]);
        res.status(200).json(problemCount[0]?.problemCount || 0);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}