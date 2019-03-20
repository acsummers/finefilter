/*Express set up*/

var express = require('express');
var app = express();

app.use(express.static('public'));
/*Python shell requirement*/
var PythonShell = require('python-shell');


/*Google api requirements and setup*/
var {google} = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var messageArray = [];
var tempIdStorage = [];

google.options({
  auth: oauth2Client
});


var gmail = google.gmail('v1');


//Note that the appdomain has to be registered with the google account running the app.
var appdomain = "http://www.finefilterapp.com/"

var oauth2Client = new OAuth2('57009974619-r6ae8uvkd08qifmoob4rn1pt69o4udj2.apps.googleusercontent.com', 't1_f1ZNbiMz1tnFzfbiAjuaY', appdomain + "load");
console.log(oauth2Client)

var scopes = ['https://www.googleapis.com/auth/gmail.modify'];

app.locals.getUrl = function() {
 return oauth2Client.generateAuthUrl({
	access_type: 'offline',
	scope:scopes
}); }


//Runs the machine learning code
 var machineLearning = function(jsonData) {
  console.log("Inside machine learning");
 	var pyshell = new PythonShell('ml.py', {mode:'text', args:[jsonData]});
	/*Need the following for input: pyshell.send('hello');*/
  console.log("pyshell initialized")

	pyshell.on('message', function(message) {
		console.log('Here is the output: ' + message + '');
	});
	pyshell.end(function (err) {
	if (err) throw err;
	console.log('finished');
	});
 }


 var messageCallback =  function(err, response, i, max, auth, messages, read, readSet, unreadSet) {
 	console.log(i);
  		if (err) {
  			console.log('The API returned an error while trying to get data from a specific message: ' + err);
  			return
  		} else {
  			if (i < max) {
  				var messageData = response;

  				snippet = messageData['snippet'];
  				subject = '';
  				headers = messageData['payload']['headers'];
  				for (var j = 0; j<headers.length; j++) {
  					if(headers[j]['name'] === 'Subject') {
  						subject = headers[j]['value'];
 					}
				}
				if (read === true) {
					read = "read";
				}
				else if (read === false) {
					read = "unread";
				}

				anId = messages[i]['id'];

  				messageArray.push({subject: subject, snippet, read});
  			

        if (i < 99 && readSet.has(messages[i+1]['id'])) {
          read = true;
        }
        else if (i < 99 && unreadSet.has(messages[i+1]['id'])) {
          read = false;
        }

  				gmail.users.messages.get({auth:auth, userId:'me', id:messages[i]['id']}, function(err,response) {
  					messageCallback(err, response, i+1, max, auth, messages, read, readSet, unreadSet);
  			});
  					 
  			}
  			else {/*
  				for (var k = 0; k<messageArray.length; k++) {
  					console.log(messageArray[k]);
  				}
  				for (var k = 0; k<tempIdStorage.length; k++){
  					console.log(tempIdStorage[k]);
  			  				}
  			  	console.log(messageArray.length);
  			  	console.log(tempIdStorage.length);*/
            //console.log("about to call machine Learning");
            theObj = {'dataArray': messageArray};
            theObj = JSON.stringify(theObj);
            console.log(theObj);
            machineLearning(theObj);
  		}
  	}}


//Gets a set of message ids, either read or unread
function getReadAndUnreadIDs(auth) {
  query = '-from:me AND is:read';


  /*else if (read === false) {
  	query += 'is:unread';
  }*/

  console.log(auth);
  console.log(query);
  gmail.users.messages.list({
  	auth:auth,
  	userId: 'me',
  	q: query
  }, function(err, responseOne) {
  	if (err) {
  		console.log('The API returned an error while trying to get a list of messages: ' + err);
      	return;
  	} else {
  	//var messages = response.messages;
  	//tempIdStorage = messages;
    gmail.users.messages.list({
      auth:auth,
      userId: 'me',
      q: '-from:me AND is:unread'},
      function(err, responseTwo) {
        if (err) {
          console.log('The API returned an error while trying to get a list of messages: ' + err);
          return;
        }
        else {
          setCallback(auth, err,responseOne, responseTwo, 0, 100, new Set(), new Set());
        }
      });
    /*var returnedSet = new Set();
    for (var i = 0; i<response.messages.length; i++) {
      returnedSet.add(messages[i]['id']);
    }
    return returnedSet;*/
  	//gmail.users.messages.get({ auth:auth, userId:'me', id:messages[0]['id']}, function(err, response) {
  	//	messageCallback(err, response, 1, 100, auth, messages, read);
  	//});
  }

  	});
}

function setCallback(auth, err, responseOne, responseTwo, i, max, setOne, setTwo) {
  if (err) {
    console.log("There was an error in setCallback");
    return set;
  }
  else {
    if (i < max) {
      setOne.add(responseOne.messages[i]['id']);
      setTwo.add(responseTwo.messages[i]['id']);
      return setCallback(auth, err, responseOne, responseTwo, i+1, max, setOne, setTwo);
    }
    else {
      console.log("set returned");
      getMessageData(auth, setOne, setTwo);
    }
  }
}

//Gets a list of messages
function getMessageData(auth, readSet, unreadSet) {
  query = '-from:me';
  console.log("This is the readSet: " + readSet);
  console.log("This is the unreadSet: " + unreadSet);
  gmail.users.messages.list({
    auth:auth,
    userId: 'me',
    q: query
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error while trying to get a list of messages: ' + err);
        return;
    } else {
    var messages = response.messages;
    tempIdStorage = messages;
    var read = null;
    if (readSet.has(messages[0]['id'])) {
        read = true;
    }
    if (unreadSet.has(messages[0]['id'])) {
        read = false
    }
    gmail.users.messages.get({ auth:auth, userId:'me', id:messages[0]['id']}, function(err, response) {
      messageCallback(err, response, 1, 100, auth, messages, read, readSet, unreadSet);
    });
  }
    


    });
}

app.get('/test', function(req,res) {
	res.send('Test in progress');
  /*Machine learning test*/
	//data = {'hi':'hello', 'greetings':'sup'};
  //data = JSON.stringify(data)
	//machineLearning(data);

  /*Message get test*/
  getReadAndUnreadIDs(oauth2Client);
});

app.get('/load', function(req,res) {
	res.render('loading.ejs');
	var code = req.query.code;
	console.log(req.query.code);
	oauth2Client.getToken(code, function (err, tokens) {
  	// Now tokens contains an access_token and an optional refresh_token. Save them.
  	if (err) {
  		console.log("There was an error");
  		console.log(err);
  	}
  	if (!err) {
   	oauth2Client.setCredentials(tokens);
   	//getMessageData(oauth2Client, true);

   	} 

	});
});

app.get('/', function(req,res) {
	res.render('holding.ejs');
});

app.get('/demo', function(req,res) {
  res.render('home.ejs')
})

app.get('/diagnostic', function(req,res) {
	res.send(messageArray.length.toString());
});

app.get('/demo2', function(req,res) {
  res.render('demo2.ejs');
});

app.get('/thankyou', function(req,res) {
  res.render('thankyou.ejs');
});

app.listen(8080, function() {
  console.log('Example app listening on port 8080!')
});

