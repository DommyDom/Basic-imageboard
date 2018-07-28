//require stuff
var express  =require("express");
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var upload = require("express-fileupload");
var path = require("path");
var fs = require("fs");
var Post = require("./models/post");
var User = require("./models/User");
var passport = require("passport");
var LocalStrategy  = require("passport-local").Strategy;
var bcrypt = require("bcryptjs");
var session = require("express-session");
var BannedUser = require("./models/BannedUser");
const bumpTime = 60*60*1000;

//setup app
var app = express();
app.set("view engine","ejs");
var viewFolder = "view"; 




//setup passport strategy

passport.use(new LocalStrategy(
  function(username, password, done) {
    User.findOne({ username: username }, function(err, user) {
      if (err) { return done(err); }
      if (!user) {
		console.log("get fucked");
        return done(null, false, { message: 'Incorrect username.' });
      }
      if (!user.validPassword(password)) {
		console.log("get not so fucked");
        return done(null, false, { message: 'Incorrect password.' });
      }
      return done(null, user);
    });
  }
));

//setup static folder
app.use(express.static("public"));


//connect db

mongoose.connect("mongodb://localhost:27017/board", { useNewUrlParser: true});
mongoose.connection.once("open",function(){
	console.log("db connection has been made");
}).on("error",function(err){
	console.log(err);
});

//lotsa middleware

app.use(session({secret:"secreative", resave: true,saveUninitialized: true}));

app.use(upload({safeFileNames: true, preserveExtension: true}));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

app.use(passport.session());


//even more passport bs


passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});





//listen to port 3000
var server = app.listen(3000,function(){
	console.log("listening 2 port 3000");
});


//init image counter :)

var imageCounter  = 0;
var postCounter =0;

fs.readFile("public/upload/imagecounter.txt","utf8",function(err,data){
	if(err) throw err;
	imageCounter = parseInt(data);
	console.log(imageCounter);
});
fs.readFile("public/upload/postcounter.txt","utf8",function(err,data){
	if(err) throw err;
	
	postCounter = parseInt(data);
	console.log(postCounter);
	
});



//bread delete after time system :^)
function checkIfBreadExpired(){
	Post.find({},function(err,result){
		var date = new Date();
		if(err) throw err;
		for(var i=0;i<result.length;i++){
			if(result[i].isBumped){
				result[i].isBumped = false;
				result[i].timeToDie = date.getTime() + bumpTime;
				result[i].save();
			}else if(result[i].timeToDie <= date.getTime()){
				fs.unlink("public/upload/" + result[i].image,function(err){
					if(err) throw err;
				});
				for(var j=0;j<result[i].comments.length;j++){
					if(result[i].comments[j].image){
						fs.unlink("public/upload/" +result[i].comments[j].image,function(err){
							if(err) throw err;
						});
					}
				}
				result[i].remove();
			}
		}
	})
}

setInterval(checkIfBreadExpired,1000*60)

//routing

app.get("/",function(req,res){
	//find all posts
	Post.find({},function(err,data){
		if(err) throw err;
		res.render("index",{posts: data,aut:req.isAuthenticated()});
	});
	
});


app.post("/",function(req,res){
	BannedUser.findOne({ip:req.ip},function(err,result){
		if(err) throw err;
		if(result) {
		res.send("you are banned and thus cant post");
		}else{
		
			if(!req.body) return res.sendStatus(400);
			if(req.files.pic){
				var file = req.files.pic;
				var filename = file.name;
				console.log();
				var extension = path.extname(filename);
				if(extension == ".jpeg"||extension ==".jpg" || extension ==".JPG" || extension ==".gif" || extension == ".png" || extension ==".PNG"){
				var newFilename = imageCounter + extension;
				imageCounter++;
				file.mv("./public/upload/" + newFilename,function(err){
					
					if(err){
						console.log(err);
						res.send("error occured");
					}
					
					//upload post here
					var date = new Date();
					var post = new Post({
						title:req.body.breadTitle,
						post:req.body.breadMessage,
						image: newFilename,
						imageName:filename,
						postID: postCounter,
						isBumped: false,
						bumpOrder: postCounter,
						timeToDie: date.getTime() + bumpTime,
						postDate: new Date(),
						commentImages: 0,
						comments:[],
						ip: req.ip
					});
					postCounter++;
					post.save().then(function(){
						
						fs.writeFile("public/upload/postcounter.txt",postCounter,function(err){
							if(err) throw err;
							
							fs.writeFile("public/upload/imagecounter.txt",imageCounter,function(err){
								if(err) throw err;
								
								Post.find({},function(err,data){
									if(err) throw err;
									res.render("index",{posts:data,aut:req.isAuthenticated()});
								});
								
							});
						});
					});
					
					
					
					
				});}else{
						res.send(extension);
					}
				
			}else{
				res.send("bring pic pls");
			}
			console.log(req.body.breadTitle);
		}
	});
	
	
});

function setupSpecPost(req,res){
	var ID = parseInt(req.params.id);
	if(Number.isInteger(ID)){
		Post.findOne({postID:ID}).then(function(result){
			if(result){
				res.render("post",{op:result,aut:req.isAuthenticated()});
			}else{
				res.send("404 not found");
			}
		});
	}else{
		res.send("send in a WHEEL numbah :3");
	}
}


app.get("/post/:id",setupSpecPost);

app.post("/post/:id",function(req,res){
	BannedUser.findOne({ip:req.ip},function(err,result){
		if(err) throw err;
		if(result) {res.send("you are banned so u cant post");
		}else{
			var ID = parseInt(req.params.id);
			if(Number.isInteger(ID)){
				Post.findOne({postID:ID}).then(function(result){
					if(result){
						var file = req.files.pic;
						var hasPic = false;
						var filename;
						var extension;
						var newFilename;
						var	comment = {
							post: req.body.commentMessage,
							postID:postCounter,
							postDate: new Date(),
							ip: req.ip
						};
						
						postCounter++;
						fs.writeFile("public/upload/postcounter.txt",postCounter,function(err){
							if(err) throw err;
						});
						
						
						if(file){
							filename = file.name;
							extension = path.extname(filename);
							if(extension == ".jpeg"||extension ==".jpg" || extension ==".JPG" || extension ==".gif" || extension == ".png" || extension ==".PNG"){
								comment.imageName = filename;
								newFilename = imageCounter + extension;
								imageCounter++;
								result.commentImages++;
								comment.image = newFilename;
								fs.writeFile("public/upload/imagecounter.txt",imageCounter,function(err){
									if(err) throw err;
								});
								file.mv("./public/upload/" + newFilename, function(err){
									if(err) throw err;
								});
							}else{
								res.send("bring an img :)");
							}
						}
						
						result.comments.push(comment);
						
						if(result.comments.length<301){result.isBumped = true;}
						result.bumpOrder = comment.postID;
						result.save().then(function(){
							setupSpecPost(req,res);
						});
					}else{
						res.send("wat");
					}
				
			});
		}else{
			send("twat");
		}
		}
	});
	
});

app.get("/login",function(req,res){
	if(!req.isAuthenticated()){
	res.render("login");
	}else{
		res.send("already logged in");
	}
});

app.post('/login', passport.authenticate('local', { successRedirect: '/',failureRedirect: '/login'}));

app.get("/logout",function(req,res){
	req.logout();
	res.redirect("/");
});

app.post("/deleteComment/:opPost/:commentID", function(req,res){
	var OP = parseInt(req.params.opPost);
	var comment = parseInt(req.params.commentID);
	if(req.isAuthenticated()){
		if(Number.isInteger(OP) && Number.isInteger(comment)){	
			Post.findOne({postID:OP},function(err,result){
				if(err) throw err;
				
				if(result){
					for(var i = 0;  i<result.comments.length;i++){
						if(result.comments[i].postID == comment){
							if(result.comments[i].image){
								result.commentImages--;
								fs.unlink("public/upload/" +result.comments[i].image,function(err){
									if(err) throw err;
								});
							}
							
							result.comments.splice(i,1);
							result.save(function(err){
								if(err) throw err;
								res.redirect("/post/" + OP);
							});
							break;
						}
						if(i === result.comments.length-1){
							res.send("did not find coment iD in op");
						}
					}
				}else{
					res.send("no op ID found");
				}
				
			});
		}else{
			res.send("bring actual numbers");
		}
	}else{
		res.send("need to be logged in as admin to delete a post");
	}
});

app.get("/deleteComment/:opPost/:commentID",function(req,res){
	if(req.isAuthenticated()){
		res.render("delete",{comment:req.params.commentID});
	}else{
		res.send("u need 2 be autenticated for dat");
	}
});

app.post("/deleteThread/:index",function(req,res){
	if(req.isAuthenticated()){
		var op = parseInt(req.params.index);
		if(Number.isInteger(op)){
			Post.findOne({postID: op},function(err,result){
				if(err) throw err;
				
				
				if(result){
					fs.unlink("public/upload/" + result.image,function(err){
									if(err) throw err;
								});
					if(result.comments){			
						for(var i = 0; i<result.comments.length;i++){
							if(result.comments[i].image){
								fs.unlink("public/upload/" +result.comments[i].image,function(err){
										if(err) throw err;
									});		
							}
					}	
						result.remove(function(err){
							if(err) throw err;
							res.redirect("/");
						});
						
					}			
					
								
				}else{
					res.send("did not find thread");
				}
				
			});
		}else{
			res.send("need to send an acutal numbers");
		}
	}else{
		res.send("you need to be logged in as admin for this");
	}
	
});

app.get("/deleteThread/:index",function(req,res){
	if(req.isAuthenticated()){
		res.render("delete",{comment:req.params.res});
	}else{
		res.send("you need to be connected for dat");
	}
});

app.post("/ipBan/:ip",function(req,res){
	if(req.isAuthenticated()){
		
		BannedUser.findOne({ip:req.params.ip},function(err,result){
		
			if(result){
				res.send("ip alrdy banned");
			}else{
				var user = new BannedUser({
				ip: req.params.ip
				});
				user.save().then(function(){
					res.redirect("/");
				});
			}
		
		});
		
		
		
	}else{
		res.send("need 2 be logged in");
	}
});

app.get("/ipBan/:ip",function(req,res){
	if(req.isAuthenticated()){
		res.render("ipBan",{ip:req.params.res});
	}else{
	res.send("need to be logged in for this");
	}
});

