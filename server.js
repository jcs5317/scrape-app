// Dependencies
var express = require("express");
var mongojs = require("mongojs");
// Require axios and cheerio. This makes the scraping possible
var axios = require("axios");
var cheerio = require("cheerio");

// Initialize Express
var app = express();

// Database configuration
var databaseUrl = "scraper";
var collections = ["scrapedData"];

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);
db.on("error", function(error) {
  console.log("Database Error:", error);
});

// Main route (simple Hello World Message)
app.get("/", function(req, res) {
  res.send("Hello world");
});

// Retrieve data from the db
app.get("/all", function(req, res) {
  // Find all results from the scrapedData collection in the db
  db.scrapedData.find({}, function(error, found) {
    // Throw any errors to the console
    if (error) {
      console.log(error);
    }
    // If there are no errors, send the data to the browser as json
    else {
      res.json(found);
    }
  });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function(req, res) {
    // Make a request via axios for the news section of `ycombinator`
    axios.get("https://news.ycombinator.com/").then(function(response) {
      // Load the html body from axios into cheerio
      var $ = cheerio.load(response.data);
      // For each element with a "title" class
      $(".title").each(function(i, element) {
        // Save the text and href of each link enclosed in the current element
        var title = $(element).children("a").text();
        var link = $(element).children("a").attr("href");
  
        // If this found element had both a title and a link
        if (title && link) {
          // Insert the data in the scrapedData db
          db.scrapedData.insert({
            title: title,
            link: link
          },
          function(err, inserted) {
            if (err) {
              // Log the error if one is encountered during the query
              console.log(err);
            }
            else {
              // Otherwise, log the inserted data
              console.log(inserted);
            }
          });
        }
      });
    });
  
    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
  });
  
  
  // Listen on port 3000
  app.listen(3000, function() {
    console.log("App running on port 3000!");
  });
  
  // Dependencies
var express = require('express');
var exphbs  = require('express-handlebars');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

// Handlebars setup
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Scraping tools
var request = require('request');
var cheerio = require('cheerio');

// Use morgan and bodyparser with app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// Make public a static dir
app.use(express.static('public'));

// Database configuration with mongoose
// UNCOMMENT WHEN HEROKU:ENTER MONGOOSE CONNECTION URI FROM TERMINAL
mongoose.connect('mongodb://heroku_bgl64psv:ou5kf61v2vlq2v8lcva579c7fb@ds031832.mlab.com:31832/heroku_bgl64psv');

var db = mongoose.connection;

// Show any mongoose errors
db.on('error', function(err) {
    console.log('Mongoose Error: ', err);
});

// Once logged in to the db through mongoose, log a success message
db.once('open', function() {
    console.log('Mongoose connection successful.');
});

// Bring in the Note and Article models
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


// ROUTES
// ======

// app.get('/', function (req, res) {
//     res.render('index.html');
// });

// Index route that scrapes the website
app.get('/scrape', function(req, res) {

    // Grab the body of the html with request
    request('https://www.reddit.com/r/news/', function(error, response, html) {

        // Load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(html);

        // Grab every h2 within an article tag
        $('p.title').each(function(i, element) {

            // Save an empty result object
            var result = {};

            // Save the text and href of every link as properties of the result obj
            result.title = $(this).text();
            result.link = $(this).children().attr('href');

            // Using the Article model, create a new entry and pass in the result object (title and link)
            var entry = new Article (result);

            // Save that entry to the db
            entry.save(function(err, doc) {

                // Display error or entry to console
                if (err)
                    console.log(err);
                else
                    console.log(doc);
            });
        });
        res.render('home',{
            scrapesource: "Reddit"
        });
    });
});

// this will get the articles we scraped from the mongoDB
app.get('/articles', function(req, res){
    // grab every doc in the Articles array
    Article.find({}, function(err, doc){
        // log any errors
        if (err){
            console.log(err);
        }
        // or send the doc to the browser as a json object
        else {
            res.json(doc);
        }
    });
});

// grab an article by it's ObjectId
app.get('/articles/:id', function(req, res){
    // using the id passed in the id parameter,
    // prepare a query that finds the matching one in our db...
    Article.findOne({'_id': req.params.id})
    // and populate all of the notes associated with it.
        .populate('note')
        // now, execute our query
        .exec(function(err, doc){
            // log any errors
            if (err){
                console.log(err);
            }
            // otherwise, send the doc to the browser as a json object
            else {
                res.json(doc);
            }
        });
});


// replace the existing note of an article with a new one
// or if no note exists for an article, make the posted note it's note.
app.post('/articles/:id', function(req, res){
    // create a new note and pass the req.body to the entry.
    var newNote = new Note(req.body);

    // and save the new note the db
    newNote.save(function(err, doc){
        // log any errors
        if(err){
            console.log(err);
        }
        // otherwise
        else {
            // using the Article id passed in the id parameter of our url,
            // prepare a query that finds the matching Article in our db
            // and update it to make it's lone note the one we just saved
            Article.findOneAndUpdate({'_id': req.params.id}, {'note':doc._id})
            // execute the above query
                .exec(function(err, doc){
                    // log any errors
                    if (err){
                        console.log(err);
                    } else {
                        // or send the document to the browser
                        res.send(doc);
                    }
                });
        }
    });
});


// listen on port 3000
app.listen(process.env.PORT || 3000, function() {
    console.log('App running on port 3000!');
});