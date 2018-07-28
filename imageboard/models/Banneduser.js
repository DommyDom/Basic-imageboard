var mongoose = require("mongoose");

const Schema = mongoose.Schema;

BanneduserSchema = new Schema({
	ip: String
});

const Banneduser = mongoose.model("Banneduser",BanneduserSchema);

module.exports = Banneduser;