"use strict";
  
var fs = require('fs');
var OAuth = require('oauth');
var Q = require('q');
var open = require('open');
var path = require('path');

var qauthConfig = require('./qauthConfig.js');
var qpath = path.join(path.dirname(require.main.filename), qauthConfig.DefaultOutputFile);
  

var twitterApiConfig = require('./twitterApiConfig.js');
var twitterUserConfig = null;
var silent = false;
module.exports ={
  init: init
};

function log(){
  if(!silent) console.log.apply(global, arguments);
}

function init(isSilent){

  silent = isSilent;
  var deferred = Q.defer();
  try{
    log('\nI\'m looking for a twitter user config file ('+qpath+')...');
    twitterUserConfig = require(qpath);
    log('\nI found a config for ',twitterUserConfig.user.screen_name);
    log('\nNothing left to do, then! Happy botmaking ♥');
    deferred.resolve(twitterUserConfig);
  }catch(e){
    log('\nThere doesn\'t appear to be a twitter user config file. This is normal if you haven\'t been asked for your PIN yet. Let\'s get OAuth set up now.\n\nRunning twitter login...');
    twitterLogin().then(function(data){
      log("\nTwitter login complete! Saving twitter user config for next time...");
      
      writeTwitterConfig(data).then(function(d){
        deferred.resolve(data); 
        console.warn('Saved.'); 
      })['catch'](function(err){
        deferred.reject(err);
        console.warn('\n\nWriting the file failed. :( ('+err+')');
      });
      
    }).catch(function(err){
      log("\n\nIt didn't work. Sorry about that! :( ERROR:\n\n ", err);
      deferred.reject(err);
      process.exit();
    });
  }
  return deferred.promise;
}

function silentLog(){}

function prompt(message){
  var d = Q.defer();
  var stdin = process.openStdin();
  console.warn(message);
  stdin.on('data', function(data) {
    data = (data + ' ').trim();
    if(!data) {
      console.warn('\nI got an empty string for some reason. :( ');
      d.reject('Received no data when prompting for ' + message);
    }
    d.resolve(data);
    stdin.destroySoon();
  });   
  return d.promise;
}

function twitterLogin(){
  log('\nSetting up OAuth...');

  var auth = Q.defer();
  
  var apiKey = null;
  var apiSecret = null;
  var secretPromise = null;
    
  console.log("\n\n\n************\nTo prevent accidents, please open Twitter in your default web browser and log in as your bot account.\n\nThen provide your Twitter app's API info. If you don't have this, you can find it in your http://dev.twitter.com account. \n\n");
  var keyPromise = prompt("Twitter Api/Consumer Key: ").then(function(key){
    apiKey = key;
  }).then(function(){
    secretPromise = prompt("Twitter Api/Consumer Secret: ").then(function(secret){
      apiSecret = secret;
    }).then(function(){
      
      var oauth = new OAuth.OAuth(
        twitterApiConfig.TwitterRequestTokenUrl,
        twitterApiConfig.TwitterAccessTokenUrl,
        apiKey,
        apiSecret,
        twitterApiConfig.ApiVersion,
        null,
        twitterApiConfig.HMAC
      );
      
      oauth.getOAuthRequestToken(function(err, oauth_token, oauth_token_secret, results){
        if(err) throw err;
  
        var url = twitterApiConfig.TwitterAuthorizeUrl + '?oauth_token=' + oauth_token;
        open(url);
        console.warn('\nPlease open Twitter in a web browser and log in as your bot account. \nThen open the following URL in that browser to give your app access: \n' + url + "\n");
        var stdin = process.openStdin();
        prompt('\nEnter the PIN displayed in your web browser: ').then(function(pin){
          console.warn('Received PIN: ' + pin);
          oauth.getOAuthAccessToken( oauth_token, oauth_token_secret, pin, function(err, oauth_access_token, oauth_access_token_secret, userInfo) {
            if(err) throw err;

            log(userInfo);

            var user = {};
            
            if(userInfo) {
                user.user_id = userInfo.user_id;
                user.screen_name = userInfo.screen_name;
            }

            oauth.accessToken = oauth_access_token;
            oauth.accessTokenSecret = oauth_access_token_secret;
            
            auth.resolve({ 
              consumer_key: apiKey,
              consumer_secret: apiSecret,
              access_token_key: oauth_access_token,
              access_token_secret: oauth_access_token_secret,
              user: user
            });

            stdin.destroySoon();
          });
        });
      });
    });
  });
    
  return auth.promise;
}

function writeTwitterConfig(data){
  var d = Q.defer();
  
  var text = "module.exports="+JSON.stringify(data)+";";
  fs.writeFile(qpath, text, function(err){
    if(err){
      log('\nI couldn\'t save the config file. :( Reason: ' + err);
      d.reject(err);
      return;
    }
    d.resolve(text);
    return;
  });
  return d.promise;
}