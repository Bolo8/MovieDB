var express = require('express');
var router = express.Router();
var getJSON = require('get-json');
var MongoClient = require('mongodb').MongoClient;

var dbUrl = 'mongodb://localhost:27017/movieDb';

router.get('/', function(req, res, next) {
  res.render('index',{Info:'Enter movie title'});
});


router.post('/movie', function(req, res){
  var title = req.body;
  var url = `http://www.omdbapi.com/?t=${title.movie}&apikey=fbed9b74`;
  getJSON(url,function(error, response){
    MongoClient.connect(dbUrl, async function(err,db){
      if(err) throw err;
        myDb = db.db('movieDb');
      
        //check if title is already in db
        var isInsideDb = false;
        var titlesInsideDb = [];
        var movieTitlesInsideDb = myDb.collection('movies').find();
        await movieTitlesInsideDb.forEach(title=>{
          titlesInsideDb.push(title.Title);
          if(title.Title==response.Title){
            isInsideDb=true;
          }
        });
        if(isInsideDb==false && response.Response!='False'){
            myDb.collection('movies').insertOne(response, function(err, res){
            if(err) throw err;
            console.log('Inserted');
            db.close();
          });
          res.render('movieInformation',{movieInfo:response});
        }
        else if(isInsideDb==true && response.Response!='False'){
          res.render('movieInformation',{movieInfo:response});
          db.close();
        }
        else{
          console.log('Already in db or movie does not exist');
          res.render('index',{Info:"Inserted movie doesn't exist. Try again"});
          db.close();
        }
          
    });
  })
})

router.get('/movie', function(req,res){
  var movies = [];
    MongoClient.connect(dbUrl,function(err,db){
      if(err) throw err;
      myDb = db.db('movieDb');
      var movie = myDb.collection('movies').find();
      movie.forEach(title => {
          movies.push(title);
      },()=>{
        db.close();
        res.render('movies',{titles:movies});
      });
    });
})

router.post('/comments', function(req,res){
  var comment = req.body;
  var movieDocs = [];
  MongoClient.connect(dbUrl,async function(err,db){
    if(err) throw err;
    myDb = db.db('movieDb');
    myDb.collection('movies').update({imdbID:comment.id},{$push: {comments:comment.message}});
    var movieInfo = myDb.collection('movies').find({imdbID:comment.id});
    await movieInfo.forEach(movieTitle=>{
      movieDocs.push(movieTitle);
    })
    res.render('movieInformation',{movieInfo:movieDocs[0]});
    });
});

router.get('/comments', function(req,res){
    var comments = [];
    MongoClient.connect(dbUrl, async function(err,db){
      if (err) throw err;
      myDb = db.db('movieDb');
      var allComments = myDb.collection('movies').find({comments:{$exists:true}});
      await allComments.forEach(comment =>{
        let tempArray = [];
        for(i=0;i<comment.comments.length;i++){
          tempArray.push(comment.comments[i]);
        }
        comments.push({title:comment.Title,comments:tempArray})
      },()=>{
        db.close();
        res.render('comments',{comms:comments});
        console.log(comments[0].title);

      });
    });
});

module.exports = router;
