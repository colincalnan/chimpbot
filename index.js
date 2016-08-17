var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.listen((process.env.PORT || 3000));

// Server frontpage
app.get('/', function (req, res) {
    res.send('This is TestBot Server');
});

// Facebook Webhook
app.get('/webhook', function (req, res) {
    if (req.query['hub.verify_token'] === 'chimpbot_verify_token') {
        res.send(req.query['hub.challenge']);
    } else {
        res.send('Invalid verify token');
    }
});

// Facebook Webhook
// handler receiving messages
app.post('/webhook', function (req, res) {
    var events = req.body.entry[0].messaging;
    console.log("events", events);
    for (i = 0; i < events.length; i++) {
        var event = events[i];  
        if (event.message && event.message.text) {
            // if (!kittenMessage(event.sender.id, event.message.text)) {
            //     sendMessage(event.sender.id, {text: "Echo: " + event.message.text});
            // }
            searchCharities(event.sender.id, event.message.text);
        } else if (event.postback) {
          console.log("Postback received: " + JSON.stringify(event.postback));
        }
    }
    res.sendStatus(200);
});

// generic function sending messages
function sendMessage(recipientId, message) {
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token: process.env.PAGE_ACCESS_TOKEN},
        method: 'POST',
        json: {
            recipient: {id: recipientId},
            message: message,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('Error sending message: ', error);
        } else if (response.body.error) {
            console.log('Error: ', response.body.error);
        }
    });
};

// send rich message with kitten
function kittenMessage(recipientId, text) {
    
    text = text || "";
    var values = text.split(' ');
    
    if (values.length === 3 && values[0] === 'kitten') {
        if (Number(values[1]) > 0 && Number(values[2]) > 0) {
            
            var imageUrl = "https://placekitten.com/" + Number(values[1]) + "/" + Number(values[2]);
            
            message = {
                "attachment": {
                    "type": "template",
                    "payload": {
                        "template_type": "generic",
                        "elements": [{
                            "title": "Kitten",
                            "subtitle": "Cute kitten picture",
                            "image_url": imageUrl ,
                            "buttons": [{
                                "type": "web_url",
                                "url": imageUrl,
                                "title": "Show kitten"
                                }, {
                                "type": "postback",
                                "title": "I like this",
                                "payload": "User " + recipientId + " likes kitten " + imageUrl,
                            }]
                        }]
                    }
                }
            };
    
            sendMessage(recipientId, message);
            
            return true;
        }
    }
    
    return false;
};

function searchCharities(recipientId, text) {
  // Sanitize text
  // Hit Chimp Search endpoint
  // Pick top 3 Charities and send back as message with option to pick the next 3
  // Also give an option to search again
  // When they choose one, then ask them how much they want to donate, $10, $20 or $50

  request({
      url: 'https://chimp.net/search_suggest',
      qs: {search: text, include_links: true, include_meta: true},
      method: 'GET',
      json: {}
  }, function(error, response, body) {
      if (error) {
          console.log('Error sending message: ', error);
      } else if (response.body.error) {
          console.log('Error: ', response.body.error);
      }
      var charities = body.values
      var elements = []
      for(var i = 0; i < charities.length; i++) {
        var link = charities[i].link.split('/');
        console.log('link', link);
        elements[i] = {
          "title": charities[i].name,
          "subtitle": charities[i].meta.join(" "),
          "image_url": "https://d1sfxtpe5l0d0y.cloudfront.net/assets/avatars/chimp-icon-charity.png" ,
          "buttons": [{
              "type": "web_url",
              "url": "http://chimp.net" + charities[i].link,
              "title": "See Charity Page",
          }, {
              "type": "web_url",
              "url": "http://chimp.net/send/to/charity/" + link[2] + '/gift/new',
              "title": "Donate to Charity",
          }]
        };
      }
      console.log(elements);
      message = {
          "attachment": {
              "type": "template",
              "payload": {
                  "template_type": "generic",
                  "elements": elements
              }
          }
        };
        
        sendMessage(recipientId, message);
  });
}