const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const ejs = require('ejs')
const config = require('./config.json');

const app = express();
app.use(bodyParser.json());
app.set('view engine', 'ejs');
const PORT = config.port;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


app.post('/sendDelayedEmail', async function(req,res){

  if(req.body.Data.slice(0,5) != "data:"){
    imageData = "data:image/jpeg;base64,"+req.body.Data
  }
  else{
    imageData = req.body.Data;
  }

  var transporter = await nodemailer.createTransport({
    host: config.smtp,
    port: 465,
    secure: true, // use SSL
    auth: {
      user: config.email,
      pass: config.password
    }
  });

  ejs.renderFile(__dirname + "/htmlFile.ejs", {fileName: req.body.FileName}, function (err, data) {
    if (err) {
      res.status(500).send("Internal server Errror");
      console.log(err);
    }else{
      var mainOptions = {

        from: "\'\"" + config.username + "\"" +'<' + config.email + '> \'',
        to: req.body.Emailid, // list of receivers
        subject: "Auto generated",
        html: data,
        attachments: [
          {
            path: imageData,
            encoding: 'base64',
            cid: 'unique'
          },
          {
            filename: req.body.FileName,
            path: imageData,
            encoding: 'base64',
          },
          {
            filename: 'test.html',
            content: data
          }
        ]
      };

      res.status(200).send("A mail will be sent to you after " + req.body.Timeout +" seconds");
      console.log("A mail will be sent to you after " + req.body.Timeout +" seconds");

      setTimeout( function(){
        transporter.sendMail(mainOptions, function (err) {
          if (err) {
            console.log(err);
            res.status(400).send("Please try later.");
          }
        });
        console.log("Check your email now");
        }, (req.body.Timeout*1000));
    }
  });
});

var server = app.listen(PORT, function () {
  var host = server.address().address;
  var port = server.address().port;
  console.log("app listening at http://%s:%s", host, port);
});
