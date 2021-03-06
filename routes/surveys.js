var express = require('express');
var router = express.Router();
QUESTION_LIMIT = 10;
ANSWER_LIMIT = 10;

router.post('/', function(req, res, next){
  var survey = req.body
  var qCounter = 0, aCounter = 0;
  survey.created_at = new Date();
  for (var qIndex in survey.questions) {
    for (var ansIndex in req.body.questions[qIndex].answers) {
      survey.questions[qIndex].answers[ansIndex].count = 0;
      aCounter += 1;
      if (aCounter > ANSWER_LIMIT) {
        break
      }
    }
    qCounter += 1;
    if (qCounter > QUESTION_LIMIT) {
      break
    }
  }
  var collection = req.db.get('surveys');
  collection.insert(survey, function(err, result){
    var jObject = {surveyId: result._id, overflow: ""};
    if (qCounter > QUESTION_LIMIT) {
      jObject.overflow += "Discarded excessive questions";
    }
    if (aCounter > ANSWER_LIMIT) {
      jObject.overflow += "| Discarded excessive answers";
    }
    res.json(jObject);
  })
});

router.get('/', function(req, res, next) {
  var collection = req.db.get('surveys');
  collection.find({}, 'title', function(err, surveys){
    res.json({surveys: surveys});
  })
});

router.get('/:id', function(req, res, next) {
  var collection = req.db.get('surveys');
  collection.findOne({_id: req.params.id}, {count: 0}, function(err, survey) {
    res.json({survey: survey});
  })
});

router.put('/:id', function(req, res, next) {
  var collection = req.db.get('surveys');
  collection.findOne({_id: req.body.id}, function(err, survey) {
    for (var qIndex in req.body.response){
      for (var i in req.body.response[qIndex].ids) {
        if (!survey.questions[qIndex].multi) {
          var ansIndex = req.body.response[qIndex].ids[i];
        } else {
          if(req.body.response[qIndex].ids[i]) {
            var ansIndex = i;
          }
        }
        survey.questions[qIndex].answers[ansIndex].count += 1;
      }
    }

    collection.update({_id: req.body.id}, survey, function(err, result) {
      if (err) {
        res.json({err: err});
      } else {
        var voted = req.cookies.voted;
        voted += ("&" + req.body.id);
        res.cookie('voted', voted);
        res.json({result: result});
      }
    });
  });
});

module.exports = router;
