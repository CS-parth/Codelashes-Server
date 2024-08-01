const ratingSystem = require("../utils/ratingSystem");

exports.getRanking = async (req,res)=>{
    try{
        const {id} = req.params;
        const LeaderBoard = await new ratingSystem().getLeaderBoard(id);
        LeaderBoard.sort((a,b)=> a.ranking-b.ranking);
        return res.status(200).json(LeaderBoard);
    }catch(err){
        console.error(err);
        res.status(500).json({message: "Internal Server Error"});
    }
}