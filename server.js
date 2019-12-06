var express = require('express');
var app = express();
var cfEnv = require('cfenv');
var path = require('path');
var bodyParser = require('body-parser');
//var server = app.listen(8080)
var server = app.listen(process.env.PORT || 6000)
var io = require('socket.io').listen(server);
var request = require('request');
const crypto = require("crypto");
const userConversation = require('./database/userConversation');
const insightsModule = require('./database/insightsModule');
var insightPrototype = new insightsModule();
const enableBot = require('./database/enableBot');
var mongoose = require('mongoose')
//Body Parser
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(bodyParser.json())

var appEnv = cfEnv.getAppEnv();
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Methods", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, content-type, Accept");
	next();
});
mongoose.connect('mongodb+srv://yagnes:mlab@cluster0-s1fce.mongodb.net/test?retryWrites=true&w=majority', { useNewUrlParser: true }, function (err, resp) {
	if (err)
		console.log(err)
	else
		console.log("connected")
});
var requestSchema = new mongoose.Schema({
	'_id': String,
	'userid': String,
	'agent': Boolean,
	'sid': String

})
var agentdata=[],userlist = []
var requests = mongoose.model('requests', requestSchema);
app.use('/', express.static('public'))

var name;
var agentname;
app.get('/test-agentBackend', (req, res) => {
	console.log(" This is Sample API");
	res.send(" Client Backend is successfully running");
})
io.on('connection', function (socket) {
	socket.on('connection', function (agent) {
		console.log("agent connected")
		var data = {
			'_id': agent,
			'userid': '',
			'agent': false,
			'sid': socket.id
		}
		
		requests.find({ '_id': agent }, function (err, resp) {
			if (resp.length == 0) {				
				requests.create(data, function (error, data1) {
					requests.find({'_id': agent}, function (err, resp1) {agentdata.push(resp1[0]);})
					console.log('created',error, data1)
				})
			}
			else {
				requests.update({ '_id': agent }, { 'sid': socket.id }, function (err, res) {
					if(res){
					requests.find({}, function (err, resp1) {
						if(resp1){
						agentdata=[];
						agentdata=resp1
						console.log('1111111111111111111111',agentdata)
						}
					})
					console.log("updated",agentdata)	
					}
				})
			}
		})
	})

	socket.on('logout', function (agent) {
		console.log("logout")
		requests.update({ '_id': agent },{'sid':''}, function (err, res) {
			console.log(err, res)
		})
	})
	
	console.log("id", socket.id);
	socket.emit('test', "hello");
	app.post('/getrequest', (req, res) => {
			requests.find({}, function (err, data) {
			console.log("agents available", data)
				agentdata=[]
			agentdata = data;
		})
		console.log("2222222222222222222222222")
		userInfo(req.body.fbId).then((userData) => {
			console.log("userData", userData);
			insightUserRequestFunction({ "fbId": req.body.fbId, "msg": req.body.msg, "firstName": userData.first_name, "lastName": userData.last_name, "conversationId": req.body.conversationId })
			var i = userlist.findIndex(x => x.fbId === req.body.fbId);
			if (i == -1) {	
				console.log('####user added')			
				userlist.push({ "fbId": req.body.fbId, "agentid": '','data': { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": false } })
				agentdata.forEach(data => {
								if (!data.agent&&data.sid!='') {
									userlist.forEach(user => {							
										if (user.agentid == ''&&data.userid=='') {
											// user.agentid=data.sid
											// data.userid=user.fbId
											console.log('userlistloopp',userlist)
											console.log('socket emitted')
											io.to(data.sid).emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": false })
											data.agent=true
											
										}					
									})
								}
							});
				// io.sockets.emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic,"agentid": false })				
			}else{
			if (userlist[i].agentid == '') {			
				console.log('####agent null')		
				agentdata.forEach(data => {
					if (!data.agent&&data.sid!='') {
						userlist.forEach(user => {							
							if (user.agentid == ''&&data.userid=='') {
								// user.agentid=data.sid
								// data.userid=user.fbId
								console.log('userlistloopp',userlist)
								console.log('socket emitted')
								io.to(data.sid).emit('message', { "body": userlist[i].data.body, "firstName": userlist[i].data.first_name, "profilePic": userlist[i].data.userData.profile_pic, "agentid": false })
								data.agent=true
								requests.update({ '_id': data._id }, { 'agent': true ,'userid':user.fbId}, function (err, res) {
									console.log("update")
								})
							}					
						})
					}
				});
				// io.sockets.emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic,"agentid":false })
				// console.log("emitted")
			} else {		
				console.log('####agent added')			
				io.to(userlist[i].agentid).emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": true })
			}
		}
			// if (i == -1) {
			// 	console.log('####user added')
			// 	userlist.push({ "fbId": req.body.fbId, "agentid": '' })
			// 	if (userlist.length != 0){					
			// 		agentdata.forEach(data => {
			// 			if (!data.agent) {
			// 				userlist.forEach(user => {							
			// 					if (user.agentid == '') {
			// 						user.agentid=data.sid
			// 						data.userid=user.fbId
			// 						console.log('userlistloopp',userlist)
			// 						console.log('socket emitted')
			// 						io.to(data.sid).emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": false })
			// 						data.agent=true
			// 						requests.update({ '_id': data._id }, { 'agent': true ,'userid':user.fbId}, function (err, res) {
			// 							console.log("update")
			// 						})
			// 					}					
			// 				})
			// 			}
			// 		});
			// 	}
			// 	// io.sockets.emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": false })
			// }
			//  else {
			// 	 	var i = userlist.findIndex(x => x.fbId === req.body.fbId);
			// 		console.log('####agent added',userlist)
			// 		io.to(userlist[i].agentid).emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": true })
			// 	}
			
			
		// console.log('userlist',userlist.length,userlist)
			
		// 	i = userlist.findIndex(x => x.fbId === req.body.fbId);
		// 	if(i>=0)
		// 	io.to(userlist[i].agentid).emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": true })
		// setInterval(function()  {
		// 	console.log("**********************************executer for every 5 seconds*********************************",agentdata)
		// 	agentdata.forEach(data => {
		// 		if (!data.agent&&data.sid!='') {
		// 			userlist.forEach(user => {	
		// 				console.log(user ,agentdata,data)						
		// 				if (user.agentid == ''&&data.userid=='') {
		// 					console.log('userlistloopp',userlist)
		// 					console.log('socket emitted')
		// 					io.to(data.sid).emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": false })
		// 					data.agent=true							
		// 				}					
		// 			})
		// 		}
		// 	});
		// }, 3*1000);

			setTimeout(() => {
				var i = userlist.findIndex(x => x.fbId === req.body.fbId);
				if (i >= 0 && userlist[i].agentid == '') {
					console.log("#############################auto emit")
					io.sockets.emit('autoend', userlist[i])					
					enableBot({ "fbId": userlist[i].fbId }).then(() => {
						loginSuccessMessage(userlist[i].fbId, "Our agents are busy at this moment, Please contact later.Thank you.")
						userlist.splice(i, 1)
					})
				}
			}, 20 * 1000);
		})
		res.send("success")
	
	})


	socket.on('sendMsg', function (msg, userid, cid) {
		loginSuccessMessage(userid, msg)
		console.log(msg, userid)
		userInfo(userid).then((userData) => {
			console.log("userData", userData);
			insightBotResponseFunction({ "fbId": userid, "msg": msg, "firstName": userData.first_name, "lastName": userData.last_name, "conversationId": cid, })
		})
		typingOn(userid)
		
	})
	socket.on('status', function (id, sid, agent) {
		loginSuccessMessage(id, "You have been successfully connected with our Agent, " + agent + '.');
		userConversation({ "fbId": id }).then((response) => {
			console.log("conversation", 'response')
			// io.sockets.emit('conversation', response)
			var i = userlist.findIndex(x => x.fbId === id);
			requests.update({ 'sid': sid }, { 'agent': true ,'userid':id}, function (err, res) {
				console.log("update")

			})
			console.log(userlist, i)
			userlist[i].agentid = sid;
			io.to(sid).emit('conversation', response);
			io.sockets.emit('ack', { 'fbId': userlist[i].fbId, 'agentid': userlist[i].agentid });
		})
	})
	socket.on('end', function (id, agent) {
		requests.update({'userid':id},{'agent':false,'userid':''},function(err,res){
			console.log("agent available now",err,res)
			requests.find({'_id':agent},function(err,data){
			userlist.forEach(user => {						
				if (user.agentid == '') {
					// user.agentid=data.sid
					// data.userid=user.fbId
					console.log('userlistloopp',userlist)
					console.log('socket emitted')
					io.to(data.sid).emit('message', { "body": req.body, "firstName": userData.first_name, "profilePic": userData.profile_pic, "agentid": false })
					data.agent=true							
				}		
			})
	})
		var i = userlist.findIndex(x => x.fbId === id);
		loginSuccessMessage(id, "You have been disconnected from the Agent, " + agent + '.');
		console.log(i)
		userlist.splice(i, 1)

	})
})
})

function insightUserRequestFunction(basicDetails) {
	console.log('basicDetails');
	var requestMessage = {};
	console.log("******************* Chanakya Lokam account ***************");
	// console.log("basicDetails.resData in mInsights Request", basicDetails);
	requestMessage.message =
		{
			"email": "default-user",
			"user": {
				id: (basicDetails.firstName + basicDetails.lastName).toLowerCase() + "@gmail.com",
				name: basicDetails.firstName
			},
			"type": "message",
			"origin": "User",
			"recipient": "Bot",
			"text": basicDetails.msg,
			"channel": "FaceBook",
			"timestamp": "2019-04-29T18:12:50.231Z",
			"conversationID": basicDetails.conversationId,
			"id": crypto.randomBytes(8).toString("hex"),
			"intent": "Agent"
		}
	// console.log("requestMessage.message", requestMessage.message);
	insightPrototype.logMessage(requestMessage);
}
function insightBotResponseFunction(basicDetails) {
	// console.log("basicDetails.resData in mInsights Response", basicDetails);
	var responseMessage = {}
	console.log("******************* Chanakya response account ***************");
	responseMessage =

		{
			"email": "default-user",
			"user": {
				id: (basicDetails.firstName + basicDetails.lastName).toLowerCase() + "@gmail.com",
				name: basicDetails.firstName
			},
			"type": "message",
			"origin": "User",
			"recipient": "Bot",
			"text": basicDetails.msg,
			"channel": "FaceBook",
			"timestamp": "2019-04-29T18:12:50.231Z",
			"conversationID": basicDetails.conversationId,
			"id": crypto.randomBytes(8).toString("hex")
			//  "intent": "intent_Greeting"
		}
	insightPrototype.logMessage(responseMessage);
}

function userInfo(id) {
	return new Promise(function (resolve, reject) {
		request('https://graph.facebook.com/v3.2/' + id + '?fields=id,first_name,last_name,profile_pic&access_token=EAAE0pZBFEZCDQBAAkdtliYnjjua0W44XscD6gXzOySdXwD4Gg69ZCZAbmnfQ16vO60ZAB0viM3z108mAZBvWIy3Y6d558At6OnZCXq9bif9Wu4B3bRf2ZBaYEp79Uaj2ZBo1OB4tz2mgcQMqwJaLs7rWv3yaaGwwYHO8l69UhRuhZA7ZAeZB6ZCu3ANxi',
			async function (err, response, body) {
				if (err) {
					reject({ "error": err })
				}
				else {
					var res = JSON.parse(body)
					resolve({ "first_name": res.first_name, "profile_pic": res.profile_pic })
				}
			})

	});
}
function loginSuccessMessage(id, text) {
	console.log("***************************************************")
	var dataPost = {
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: 'EAAE0pZBFEZCDQBAAkdtliYnjjua0W44XscD6gXzOySdXwD4Gg69ZCZAbmnfQ16vO60ZAB0viM3z108mAZBvWIy3Y6d558At6OnZCXq9bif9Wu4B3bRf2ZBaYEp79Uaj2ZBo1OB4tz2mgcQMqwJaLs7rWv3yaaGwwYHO8l69UhRuhZA7ZAeZB6ZCu3ANxi' },
		method: 'POST',
		json: {
			recipient: { id: id },
			message: {
				text: text
			}
		}
	};
	requestFun(dataPost)
}
function typingOn(id) {
	var dataPost = {
		url: 'https://graph.facebook.com/v2.6/me/messages',
		qs: { access_token: 'EAAE0pZBFEZCDQBAAkdtliYnjjua0W44XscD6gXzOySdXwD4Gg69ZCZAbmnfQ16vO60ZAB0viM3z108mAZBvWIy3Y6d558At6OnZCXq9bif9Wu4B3bRf2ZBaYEp79Uaj2ZBo1OB4tz2mgcQMqwJaLs7rWv3yaaGwwYHO8l69UhRuhZA7ZAeZB6ZCu3ANxi' },
		method: 'POST',
		json: {
			recipient: { id: id },
			sender_action: "typing_on"
		}
	};
	requestFun(dataPost)
}
function requestFun(dataPost) {

	request(dataPost, (error, response, body) => {
		if (error) {
			console.log('Error when we try to sending message: ', error);
		} else if (response.body.error) {
			console.log('Error: ', response.body.error);
		}
	});

}
//Port Initialization
 //http.listen(process.env.PORT || 6000, function () {
 //	console.log('Application port number 6000');
 //});2341743119272855
