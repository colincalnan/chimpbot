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
      let charities = body.values
      console.log('charities', charities);
      message = {
          "attachment": {
              "type": "template",
              "payload": {
                  "template_type": "generic",
                  "elements": [{
                      "title": "We found some charities",
                      // "subtitle": "Cute kitten picture",
                      // "image_url": imageUrl ,
                      "buttons": [{
                          "type": "web_url",
                          "url": charities[0].link,
                          "title": charities[0].name,
                          }, {
                          "type": "web_url",
                          "url": charities[1].link,
                          "title": charities[1].name,
                          }, {
                          "type": "web_url",
                          "url": charities[2].link,
                          "title": charities[3].name,
                          // "type": "postback",
                          // "title": "I like this",
                          // "payload": "User " + recipientId + " likes kitten " + imageUrl,
                      }]
                  }]
              }
          }
        };
        
        sendMessage(recipientId, message);
  });
}