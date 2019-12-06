module.exports=(params)=> {
    var Cloudant = require('cloudant');
    require('dotenv').config();
    var cloudant = new Cloudant({ url: "https://3bd18d5b-085c-4f56-8c1c-b265c0c58d3c-bluemix:f82abbe20a98df82420da4290f655a84afc8baf0faf697211dc9d0bbed46e93b@3bd18d5b-085c-4f56-8c1c-b265c0c58d3c-bluemix.cloudantnosqldb.appdomain.cloud", maxAttempt: 5, plugins: [ 'iamauth', { retry: { retryDelayMultiplier: 4, retryErrors: true, retryInitialDelayMsecs:1000, retryStatusCodes: [ 429 ] } } ]});
    var userDB = cloudant.db.use('user_conversation');
      return new Promise(function(resolve,reject){
        console.log(params);
        var query={
            "selector": {
               "fbId": {
                  "$eq": params.fbId
               }
            }
          }
            userDB.find(query,(err,body)=>{
              if(err){
                console.log('err getting cloudant')
                reject ({resData:'error'})
              }else{
                console.log("body",body);
                resolve({"conversation":body.docs[0]})
              }
            })
      })

//    return {values:params.phoneNumber}
  }

  //exports.main({fbId:"12345"})
