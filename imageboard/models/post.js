var mongoose = require("mongoose");

const Schema = mongoose.Schema;

const CommentSchema = new Schema({
	post: String,
	image: String,
	imageName: String,
	postDate:Object,
	ip: String,
	postID:Number,
	
});

const PostSchema = new Schema({
	title: String,
	post: String,
	image: String,
	imageName: String,
	postID: Number,
	postDate: Object,
	isBumped: Boolean,
	bumpOrder: Number,
	timeToDie: Number,
	commentImages: Number,
	ip: String,
	comments: [CommentSchema],
	
});


const Post = mongoose.model("post",PostSchema);

module.exports = Post;