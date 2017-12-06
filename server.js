var express = require('express');
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require('axios');
var cheerio = require('cheerio');

// Require all models
var db = require('./models');

var PORT = 3000;

// Initialize Express
var app = express();

// Configure middleware

// Use morgan logger for logging requests
app.use(logger('dev'));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: false }));
// Use express.static to serve the public folder as a static directory
app.use(express.static('public'));

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;

if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI)
} else {
  mongoose.connect('mongodb://localhost/week18Populater', {
    useMongoClient: true
});
}

// Routes

// A GET route for scraping the echojs website
app.get('/scrape', function(req, res) {
    // First, we grab the body of the html with request
    axios.get('https://www.npr.org/').then(function(response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);
        // Now, we grab every h2 within an article tag, and do the following:
        $('article.post-type-standard').each(function(i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(this).find('h1.title').text();
            result.link = $(this)
                .find('h1.title')
                .parent('a')
                .attr('href');
            result.summary = $(this).find('p.teaser').text()
            console.log(result);

            // Create a new Article using the `result`
            // object built from scraping
              db.Article.create(result)
                 .then(function(dbArticle) {
                    // If we were able to successfully scrape and save an Article, send a message to the client
                })
                .catch(function(err) {
                    // If an error occurred, send it to the client
                    res.json(err);
                });
        });
        res.send('Scrape Complete');

    });
});

// Route for getting all Articles from the db
app.get('/articles', function(req, res) {
    // TODO: Finish the route so it grabs all of the articles
    db.Article.find()
        .then(function(articles) {
            res.json(articles);
        })
        .catch(function(err) {
            res.json(err);
        });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get('/articles/:id', function(req, res) {
    // TODO
    // ====
    // Finish the route so it finds one article using the req.params.id,
    // and run the populate method with "note",
    // then responds with the article with the note included
    // findOne returns object, find returns array of objects (this is important for how you handle your data on the front end)
    db.Article.findOne({ _id: req.params.id })
        .populate('note')
        .then(function(article) {
            res.json(article);
        })
        .catch(function(err) {
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post('/articles/:id', function(req, res) {
    // TODO
    // ====
    // save the new note that gets posted to the Notes collection
    // then find an article from the req.params.id
    // and update it's "note" property with the _id of the new note
    db.Note.create(req.body)
        .then(function(dbNote) {
            // Take returned note and push it's _id into Articles.note array. Set new: true so it returns updated Article and not old one
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { note: dbNote._id } }, { new: true });
        })
        .then(function(dbArticle) {
            res.json(dbArticle);
        })
        .catch(function(err) {
            res.json(err);
        });
});

// Start the server
app.listen(PORT, function() {
    console.log('App running on port ' + PORT + '!');
});