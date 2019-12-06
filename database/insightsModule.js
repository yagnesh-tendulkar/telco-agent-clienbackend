const request = require('request');
var token="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDE2NmQ2OTc4NTI0YjMzMjAxOTQzMjYiLCJjcmVhdGVkQXQiOiIyMDE5LTA2LTI4VDE5OjQxOjI5Ljg4NVoiLCJpYXQiOjE1NjE3NTA4OTB9.Js75FnFv_Qu6mKjob2Go_vXLYRsau2DyWSaD1eTQYL8";
var reference="b882b6b03b52ba464c66b15e4a9a854d";

var insightsModule = function (auth_token, bot_reference) {
    token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI1ZDE2NmQ2OTc4NTI0YjMzMjAxOTQzMjYiLCJjcmVhdGVkQXQiOiIyMDE5LTA2LTI4VDE5OjQxOjI5Ljg4NVoiLCJpYXQiOjE1NjE3NTA4OTB9.Js75FnFv_Qu6mKjob2Go_vXLYRsau2DyWSaD1eTQYL8";
    reference = "b882b6b03b52ba464c66b15e4a9a854d";
};

insightsModule.prototype.logMessage = function (messageObj) {
    console.log('inside insightsModule')
   
    console.log("");
    console.log(token +"  "+reference)
    if (messageObj.message) {
         console.log(messageObj);
        var messageData = {};
        messageData.origin = "User";
        messageData.type = messageObj.message.type;
        messageData.user = messageObj.message.user;
        messageData.conversationID = messageObj.message.conversationID;
        messageData.text = messageObj.message.text;
        messageData.timestamp = new Date();
        messageData.channel = messageObj.message.channel;
        console.log("messageObj.message.intent",messageObj.message.intent);
        messageData.intent = messageObj.message.intent;
        messageData.id = messageObj.message.id
        console.log("messageData.id in Request",messageData.id);
       console.log("messageData.intent",messageData.intent);
        reportMessage(messageData);
    } else {
        if (messageObj.type == 'message') {
            var messageData = {};
            messageData.conversationID = messageObj.conversationID;
            messageData.timestamp = new Date();
            messageData.channel = messageObj.channel;
            messageData.text = messageObj.text;
            messageData.user = messageObj.user;
            messageData.origin = "Bot";
            messageData.id = messageObj.id
            console.log("messageData.id",messageData.id);
            messageData.type = messageObj.type;
            reportMessage(messageData);
        }
    };

}

module.exports = insightsModule;

function reportMessage(messageData) {

    var requestPayload = {
        
     url: "https://minsights-server-v2-1.azurewebsites.net/conversation/v4/register",
      
     // url: "https://minsights-server-v2-1.azurewebsites.net/registerconversation/",
        method: 'POST',
        json: true,
        headers: {
            'refid': reference
        },
        auth: {
            'bearer': token
        },
        body: messageData
    };
    return new Promise(function (fulfill, reject) {
        request.post(requestPayload, function (err, response, body) {
            if (!err) {
                console.log(body);
            } else {
                conosle.log("error fro insights");
                console.log(err);
            }
        });
    })
}