// Grab the articles as a json
$.get('/articles', function(data) {
    // for each one
    for (var i = 0; i < data.length; i++){
        // display the prop information on the page
        $("#articles").append("<p data-id='" + data[i]._id + "'><ul><li><a target='_blank' href='" + data[i].link + "'>" + data[i].title + "</a></p><button class='btn btn-primary' id='savebtn' data-id='" + data[i]._id + "' data-saved='" + data[i].saved +"'> Save Article</button></li></ul>");
    }
});


// whenever someone clicks a p tag
$(document).on('click', '#savebtn', function() {
    // empty the notes from the note section
    $.ajax({
        url: "/articles/update",
        method: "PUT",
        data: {
          id: $(this).data().id
        }
      }).then(result => {
        console.log(result);
      });
});

// when button clicked to add comment
$(document).on("click", "#saved", function () {
    $.get("/articles/saved", function (data) {
      $("#articles").empty();
  
      for (var i = 0; i < data.length; i++) {
        $("#articles").append("<p data-id='" + data[i]._id + "'><ul><li><a href='" + data[i].link + "'>" + data[i].title + "</a></p><button class='btn btn-primary'>Add Comment</button></li></ul>");
      }
    });
  });