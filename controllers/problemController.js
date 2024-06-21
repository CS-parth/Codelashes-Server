const Problem = require("../models/Problem");
const { Testcase } = require("../models/Testcase");
const { uploadToFirebase, removeFromFirebase, fetchFileFromFirebase, genUniqueFileName }  = require('../config/firebase');
const { getFileName } = require('../config/firebase');
exports.createProblem = async (req,res) => {
    let testcaseUrl = "";
    let answerUrl = "";
    try{
        const testcase = req.files.testcase[0];
        const answer = req.files.answer[0];
        const data = await JSON.parse(req.body.data);
        const { problemStatement, Constraints, Input, Output, sampleTestcase, time, memory } = data;
        const newProblem = new Problem({problemStatement,Constraints,Input,Output,sampleTestcase,time,memory});
        console.log(newProblem);
        const fileName = genUniqueFileName();
        const testcaseFile = await uploadToFirebase(testcase.path,`Problem-testcases/${fileName}_testcase.txt`);
        testcaseUrl = testcaseFile.fileUrl;
        const answerFile = await uploadToFirebase(answer.path,`Problem-answers/${fileName}_answer.txt`);
        answerUrl = answerFile.fileUrl;
        const newTestcase = new Testcase({});
        newTestcase.data.url = testcaseFile.fileUrl;
        newTestcase.data.access_token = testcaseFile.uuid;
        newTestcase.answer.url = answerFile.fileUrl;
        newTestcase.answer.access_token = answerFile.uuid;
        newTestcase.problem = newProblem._id;
        await Promise.all([newTestcase.save(),newProblem.save()]);
        res.status(200).send(`Problem created successfully with id: ${newProblem._id} and testcase added with id : ${newTestcase._id}`);
    }catch(err){
        if(testcaseUrl.length){
            await removeFromFirebase(testcaseUrl);
            console.info("File Removed due to unsuccessfull storing attempt!");
        }
        if(answerUrl.length){
            await removeFromFirebase(answerUrl);
            console.info("File Removed due to unsuccessfull storing attempt!");
        } 
        res.status(400).send(`${err}`);
    }
}