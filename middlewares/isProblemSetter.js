const validation = require("../utils/Validation");
const Validation = new validation();

const isProblemSetter = async (req, res) => {
  return new Promise(async (resolve, reject) => {
    try {
      const User = await Validation.getUser(req.cookies.jwt);
      if (User === null) {
        return reject({ status: 400, message: "User not found" });
      }
      if (User.role === process.env.PROBLEM_SETTER) {
        return resolve();
      } else {
        return reject({ status: 403, message: "Unauthorized User" });
      }
    } catch (error) {
      return reject({ status: 500, message: "Internal Server Error" });
    }
  });
}

module.exports = isProblemSetter;
