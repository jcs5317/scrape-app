var mongoose = require("mongoose");

// Create Schema class
var Schema = mongoose.Schema;

// Create article schema
var ArticleSchema = new Schema({

    // title is required
    title: {
        type: String,
        unique: true,
        required:true
    },
    // link is required
    link: {
        type: String,
        required:true
    },
    date: {
        type: Date,
        default: Date.now
    },
    saved: {
        type: Boolean,
        required: true,
        default: false
    },
    // Saves one note's ObjectId. refers to the Note model.
    note: {
        type: Schema.Types.ObjectId,
        ref: "Note"
    }
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;