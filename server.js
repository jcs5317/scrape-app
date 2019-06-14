  // Dependencies
var express = require('express');
var exphbs  = require('express-handlebars');
var logger = require('morgan');
var mongoose = require('mongoose');

// Scraping tools
var axios = require('axios');
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
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsdb";

mongoose.Promise = Promise;

mongoose.connect(MONGODB_URI, { useNewUrlParser: true});

/*/ Show any mongoose errors
mongoose.on('error', function(err) {
    console.log('Mongoose Error: ', err);
});

// Once logged in to the db through mongoose, log a success message
mongoose.once('open', function() {
    console.log('Mongoose connection successful.');
});*/

//app.use(routes)
// ROUTES
// ======

app.get('/', function (req, res) {

    res.render('home');
});

// when button is clicked o home page that scrapes the website
//save all the unique articles to the db and return data as json to client side js
app.get('/scrape', function(req, res) {

    // Grab the body request
    axios.get('https://old.reddit.com/r/news/')
    .then(function(response) {

        // Load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Grab every h2 within an article tag
        $('p.title').each(function(i, element) {

            // Save an empty result object
            var result = {};

            // Save the text and href of every link as properties of the result obj
            result.title = $(this)
                .text();
            result.link = $(this)
                .children()
                .attr('href');

            console.log(result);

            db.Article.create(result)
                .then(function (dbArticle) {
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    console.log(err);
                });

            /*// Using the Article model, create a new entry and pass in the result object (title and link)
            var entry = new Article (result);

            // Save that entry to the db
            entry.save(function(err, doc) {

                // Display error or entry to console
                if (err)
                    console.log(err);
                else
                    console.log(doc);
            });*/
        });

        res.redirect('/');
    });
});

// this will get the articles we scraped from the mongoDB
//html route
//find where the save is true
app.get('/articles', function(req, res){
    // grab every doc in the Articles array
    db.Article.find({})
        .then(function (dbArticle) {
            res.json (dbArticle);
            console.log(dbArticle);
        
        })
        .catch(function (err) {
            res.sjson(err);
        });
});


// grab an article by it's ObjectId optional
app.get('/articles/:id', function(req, res){
    // using the id passed in the id parameter,
    // prepare a query that finds the matching one in our db...
    db.Article.findOne({'_id': req.params.id})
    // and populate all of the notes associated with it.
        .populate('note')
        // now, execute our query
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

//Route for saved articles
app.get("/articles/saved", function (req, res) {
    db.Article.find({ saved : true })
        .then(function (dbArticle) {
            res.json(dbArticle);
            console.log(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});

// Route to delete scraped articles
app.get("/delete", function (req, res) {
    db.Article.remove({}, function (err) {
        if (err) throw err;
    })
        .then(function (result) {
            console.log("Articles Deleted");
        })
        .catch(function (err) {
            res.json(err);
        });
    res.redirect("/");
});

//update an articles saved status that is true to false or false to true
// send back json to client side js
app.put('/articles/update', function(req, res){
    db.Article.findOneAndUpdate({_id: req.body.id},{ saved : true })
    .then(function (dbArticle){
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

// Route to replace the existing note of an article with a new one 
app.post('/articles/:id', function(req, res){
    // create a new note and pass the req.body to the entry.
    db.Note.create(req.body)
        .then(function(dbNote){
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            res.json(dbArticle);
        })
        .catch(function (err) {
            res.json(err);
        });
});


// listener
app.listen(PORT, function() {
    console.log('App running on port ' + PORT + ' !');
});