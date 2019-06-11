  // Dependencies
var express = require('express');
var exphbs  = require('express-handlebars');
var logger = require('morgan');
var mongoose = require('mongoose');

// Scraping tools
var request = require('request');
var cheerio = require('cheerio');

var PORT = process.env.PORT || 3000;
var db = require("./models");
var app = express()

// Use morgan and bodyparser with app
app.use(logger('dev'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
// Make public a static folder
app.use(express.static("public"));

// Handlebars setup
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// Database configuration with mongoose
var MONGODB = process.env.MONGODB_URI || "mongodb://localhost/newsdb";

mongoose.Promise = Promise;

mongoose.connect(MONGODB);

// Show any mongoose errors
mongoose.on('error', function(err) {
    console.log('Mongoose Error: ', err);
});

// Once logged in to the db through mongoose, log a success message
mongoose.once('open', function() {
    console.log('Mongoose connection successful.');
});

//app.use(routes)
// ROUTES
// ======

app.get('/', function (req, res) {

    res.render('home');
});

// this will get the articles we scraped from the mongoDB
//html route
//find where the save is true
app.get('/articles', function(req, res){
    // grab every doc in the Articles array
    Article.find()
        .then(function (doc, err){
            console.log(doc)
            res.render("saved", doc)
        })
});

// when button is clicked o home page that scrapes the website
//save all the unique articles to the db and return data as json to client side js
app.get('/api/scrape', function(req, res) {

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

// grab an article by it's ObjectId optional
app.get('/api/articles/:id', function(req, res){
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

//update an articles saved status to true to false ove false to true
// send back json to client side js
app.put('/api/articles/:id', function(req, res){

});

//optional to delete article from db
app.delete('/api/articles/:id', function(req, res) {

})

// replace the existing note of an article with a new one 
app.post('/api/notes/articles/:id', function(req, res){
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
})

// update the existing note of an article optional
app.put('/api/notes/:idi/articles/:id')
// listen on port 3000
app.listen(PORT, function() {
    console.log('App running on port ' + PORT + ' !');
});