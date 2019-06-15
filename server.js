  // Dependencies
var express = require('express');
var exphbs  = require('express-handlebars');
var logger = require('morgan');
var mongoose = require('mongoose');
var moment = require('moment');

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
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsdb25";

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
    db.Article.find({})
        .then(function (dbArticle) {
            var hbsArticleObject = {
                articles: []
            };

            dbArticle.forEach(function(article) {
                hbsArticleObject.articles.push({
                    title: article.title,
                    saved: article.saved,
                    link: article.link,
                    date: moment(article.date).format('MM/DD/YY MM:HH A'),
                    note: article.note,
                    _id: article._id
                }) 
            });
            res.render("home", hbsArticleObject)
        })
        .catch(function (err) {
            res.sjson(err);
        });
});

// when button is clicked o home page that scrapes the website
//save all the unique articles to the db and return data as json to client side js
app.get('/api/scrape', function(req, res) {
    // call step 1
    scrape()
    // after complete
    .then(function(articles){
        // call step 2
        createArticles(articles)
        // after complete
        .then(function(dbArticles){
            // step 3
            // send data to client (html)
            if(dbArticles === false || dbArticles === "fasle") {
                res.json({sucess: false, message: "no new articles were scraped."})
            } else {
                res.json({sucess: true, articles: dbArticles})
            }
           
        }).catch(function(err){
            console.log(err)
            res.json({sucess: err, message: "no new articles were scraped."})
        })
    })
    
});

// step 2
// returns array of db article objs or a false (no db articles created)
function createArticles(articles){
    return db.Article.create(articles)
        .then(function (dbArticle) {
            // console.log(dbArticle.length)
            return dbArticle
        })
        .catch(function (err) {
            return false
        });
}

// step 1
// returns a array of article objs
function scrape(){
    return axios.get('https://old.reddit.com/r/news/')
    .then(function(response) {
        console.log("scraping");
         var articles = [];
        // Load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Grab every h2 within an article tag
        $('p.title').each(function(i, element) {

            // Save an empty result object
            var result = {};

            // Save the text and href of every link as properties of the result obj
            result.title = $(this)
                .text();

            if( $(this).children().attr('href')){
                result.link = $(this)
                .children()
                .attr('href');
            } else {
                result.link = "not available"
            }

           
            articles.push(result)

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
       
        return articles
    });
}

//Route for saved articles
app.get("/saved", function (req, res) {
    db.Article.find({ saved : true })
        .then(function (dbArticle) {
            var hbsArticleObject = {
                articles: []
            };

            dbArticle.forEach(function(article) {
                hbsArticleObject.articles.push({
                    title: article.title,
                    saved: article.saved,
                    link: article.link,
                    date: moment(article.date).format('MM/DD/YY MM:HH A'),
                    note: article.note,
                    _id: article._id
                }) 
            });
            res.render("saved", hbsArticleObject)
        })
        .catch(function (err) {
            res.json(err);
        });
});

//update an articles saved status that is true to false or false to true
// send back json to client side js
// mostly working 0_o
// db givesd back og vervsion not updated after updating
app.put('/articles/:id', function(req, res){
    // console.log(req.params.id)
    console.log("BODY original status:", req.body.saved)
    /// false
    // true
    var status = (req.body.saved === 'true' || req.body ===  true)? false : true;
    // console.log("new status:", status)
    db.Article.findOneAndUpdate({_id: req.params.id},{ saved : status })
    .then(function (dbArticle){
        // console.log("article after update: should match new status:", dbArticle)
        res.json(dbArticle);
    })
    .catch(function(err) {
        res.json(err);
    });
});

// // Route to replace the existing note of an article with a new one 
app.post('/articles/:id', function(req, res){
    // create a new note and pass the req.body to the entry.
    db.Note.create(req.body)
        .then(function(dbNote){
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id });
        })
        .then(function (dbArticle) {
            console.log(dbArticle)
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