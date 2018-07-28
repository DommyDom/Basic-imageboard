var mongoose = require("mongoose");
var bcrypt  = require("bcryptjs");
const Schema = mongoose.Schema;
userScheema = new Schema({
	username:String,
	password:String
});

userScheema.methods.validPassword = function(pwd){
	return  bcrypt.compareSync(pwd,this.password);
};

module.exports = mongoose.model("users",userScheema,"users");