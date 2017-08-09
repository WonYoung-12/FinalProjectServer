const express = require('express');
const app = express();
const bodyParser = require('body-parser');

const mysql = require('mysql');
const port = 3000;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.listen(port, function(){
  console.log('Connected 3000 port!');
});

app.get('/', function(req, res){
  console.log("테스트");
});

var pool = mysql.createPool({
  connectionLimit : 10,
  host : 'localhost',
  user : 'root',
  password : 'seoul02210',
  database : 'boostcamp'
})

// var connection = mysql.createConnection({
//   host : 'localhost',
//   user : 'root',
//   password : 'seoul02210',
//   database : 'boostcamp'
// });

// connection.connect();

app.post('/login', function(req,res) {
  pool.getConnection(function (err, connection) {
    if(err){
      console.log(err);
      connection.release();
    }
    else{
      var email = req.body.email;
      var userId = req.body.userId;
      var nickname = req.body.nickname;
      var thumbnailImagePath = req.body.thumbnailImagePath;

      // 우선 가입이 되어있는지 확인 해보자.
      var sql = 'select * from user where userId = ' + userId;
      console.log(sql);

      connection.query(sql, function(err, result){
        if(err){
          console.log(err);
          connection.release();
        }
        else{
          // 회원 가입이 되어 있는 경우.
          if(result[0] != null){
            console.log('로그인 성공', result);
            var LoginResult = { };
            LoginResult["resultCode"] = 200;
            res.json(LoginResult);
          }
            // 회원 가입이 안된 경우.  여기서 DB에 넣어주자.
          else {
            console.log('널');
            enrollUserToServer(res, email, userId, nickname, thumbnailImagePath);
          }
        }
      });
    }
  });
});

app.get('/hospital', function(req, res) {
  pool.getConnection(function (err, connection){
    if(err){
      console.log(err);
      connection.release();
    }
    else{
      console.log("레트로핏 잘 된다");
      var district = req.query.district;
      console.log(req.query.district);

      var sql = 'select * from hospital where address like "%' + district + '%"';
      console.log(sql);
      connection.query(sql, function(err, rows, fields){
        if(err){
          console.log(err);
          connection.release();
        }
        else{
          console.log('rows', rows);
          res.send(rows);
          connection.release();
        }
      });
    }
  });
});

app.get('/everyHospital', function(req, res){
  pool.getConnection(function (err, connection) {
    if(err){
      console.log(err);
      connection.release();
    }
    else{
      console.log("테스트다.");
      console.log("모든 병원 테스트");
      var sql = "select * from hospital where address != ''";
      connection.query(sql, function(err, rows, fields){
        if(err){
          console.log(err);
          connection.release();
        }
        else{
          console.log('rows', rows);
          res.send(rows);
          connection.release();
        }
      });
    }
  });
});

app.get('/enrollLatLng', function(req, res){
  pool.getConnection(function (err, connection){
    if(err){
      console.log(err);
      connection.release();
    }
    else{
      var num = req.query.num;
      var latitude = req.query.latitude;
      var longitude = req.query.longitude;
      console.log(latitude);
      console.log(longitude);

      var sql = 'update hospital set latitude = ' + latitude + ', longitude = ' + longitude + ' where num = ' + num;
      console.log(sql);

      connection.query(sql, function(err, result){
        if(err){
          console.log(err);
          connection.release();
        }
        else{
          console.log('result', result);
          res.send(result);
          connection.release();
        }
      });
    }
  });
});

app.post('/writeReview', function(req,res) {
  pool.getConnection(function (err, connection) {
    if(err){
      console.log(err);
      connection.release();
    }
    else{
      var hospitalNum = req.body.hospitalNum;
      var userId = req.body.userId;
      var title = req.body.title;
      var cost = req.body.cost;
      var content = req.body.content;
      var date = req.body.date;

      var sql = 'insert into review (hospitalNum, userId, title, cost, content, date) values (' + hospitalNum + ', ' + userId + ', "' + title + '", ' + cost + ', "' + content + '", "' + date + '")';
      console.log(sql);

      connection.query(sql, function(err, result) {
        if(err){
          console.log(err);
          connection.release();
        }
        else{
          console.log('result', result);
          var WriteResult = { };
          WriteResult["resultCode"] = 200;
          WriteResult["reviewNum"] = result["insertId"];
          res.json(WriteResult);
        }
      });
    }
  });
});

app.get('/review', function(req, res){
  pool.getConnection(function (err, connection){
    if(err){
      console.log(err);
      connection.release();
    }
    else{
      var num = req.query.num;
      console.log(num);
      var sql = 'select * from review natural join user where hospitalNum = ' + num;
      console.log(sql);

      connection.query(sql, function(err, result){
        if(err){
          console.log(err);
          connection.release();
        }
        else{
          console.log('result', result);
          // 등록된 후기가 있으면.
          if(result[0] != null){
            res.send(result);
            connection.release();
          }
          // 등록된 후기가 없으면.
          else{

          }
        }
      });
    }
  });
});

function enrollUserToServer(res, email, userId, nickname, thumbnailImagePath){
  pool.getConnection(function (err, connection) {
    if(err){
      console.log(err);
      connection.release();
    }
    else{
      var sql = 'insert into user values ("' + email + '", ' + userId + ', "' + nickname + '", "' + thumbnailImagePath + '")';
      console.log('회원 가입하자');
      console.log(sql);

      connection.query(sql, function (err, result) {
        if(err){
          console.log(err);
          connection.release();
        }
        else {
          console.log('result', result);
          var LoginResult = { };
          LoginResult["resultCode"] = 200;
          res.json(LoginResult);
        }
      });
    }
  });
}
