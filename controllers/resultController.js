const ratingSystem = require("../utils/ratingSystem");
exports.getRanking = async (req,res)=>{
    const {id} = req.params;
    const LeaderBoard = await new ratingSystem().getLeaderBoard(id);
    LeaderBoard.sort((a,b)=> a.ranking-b.ranking);
    return res.status(200).json(LeaderBoard);
}