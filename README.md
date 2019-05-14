# qauth - Quick OAuth setup for the busy #botALLY

qauth is a node module that will walk you through setting up OAuth the first time you run your program and provide the necessary config settings to your application once they've been set up. 

When you've completed the initial setup, qauth will save a config file in your project's directory. Next time the program starts, qauth will not run setup if the file has already been created--it will simply return the config in a promise.

The config object returned by qauth can be fed directly to the npm package `twitter` as shown below.

## Getting started

  1. `npm install qauth`
  
  2. reference quath in your nodejs app
  
  ```
  var qauth = require('qauth');
  var Twitter = require('twitter');
  
  var silent = false; //optional parameter (true|false*) to disable politeness
  
  qauth.init(silent).then(function(twitterConfig){
   
    var twitterClient = new Twitter(twitterConfig);
    
    var message = "hello, world! #botALLY";
    
    twitterClient.post('statuses/update', {status:message}, function(error, tweets, response){
      if(!error) console.log("Posted!");
      if(error) console.log("ERRORRRRRR", error);
    });
    
  });  
  ```
  
  
  
  ```
  module.exports = {
    "consumer_key":"ABCDEFGHIJKLMNOPQR123",
    "consumer_secret":"36Z2KBL23G6LI23G4LKV6G2LI3F46VL2KI34L4F6Lnw",
    "access_token_key":"12312312-aBc8dEfGHi0kLmn0PqR12STUv6pW0xYZ8321987o",
    "access_token_secret":"asf0ASDG07AFHLASDFO98YAOSDIGHASOIGYHALSDLGH",
    "user":{
      "user_id":"123456",
      "screen_name":"potus"
    }
  };
  ```