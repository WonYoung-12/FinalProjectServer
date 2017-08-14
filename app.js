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
// var pool = mysql.createPool({
//   connectionLimit : 10,
//   host : 'localhost',
//   user : 'root',
//   password : 'seoul02210',
//   database : 'boostcamp'
// })
var db_config = {
  host : 'localhost',
  user : 'root',
  password : 'seoul02210',
  database : 'boostcamp'
};
var connection;
function handleDisconnect(){
  connection = mysql.createConnection(db_config);
  connection.connect(function(err) {
    if(err){
      console.log("error when connecting to db : ", err);
      setTimeout(handleDisconnect, 2000);
    }
  });
  connection.on("error", function(err){
    console.log("db error", err);
    if(err.code === "PROTOCOL_CONNECTION_LOST"){
      handleDisconnect();
    }
    else{
      throw err;
    }
  });
}
handleDisconnect();
//connection.connect();
app.post('/login', function(req,res) {
  console.log("로그인 뭐가 문젤까");
  var email = req.body.email;
  var userId = req.body.userId;
  var nickname = req.body.nickname;
  var thumbnailImagePath = req.body.thumbnailImagePath;
  var flag = req.body.flag;
  // 우선 가입이 되어있는지 확인 해보자.
  var sql = 'select * from user where userId = ' + userId + ' and flag = ' + flag;
  console.log(sql);
  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      // 회원 가입이 되어 있는 경우.
      if(result[0] != null){
        console.log('로그인 성공', result);
        var LoginResult = { };
        LoginResult["resultCode"] = 200;
        LoginResult["notiFlag"] = result[0]["notiFlag"];
        res.json(LoginResult);
      }
        // 회원 가입이 안된 경우.  여기서 DB에 넣어주자.
      else {
        console.log('널');
        enrollUserToServer(res, email, userId, nickname, thumbnailImagePath, flag);
      }
    }
  });
});

app.get('/hospital', function(req, res) {
  console.log("병원 뭐가 문젤까");
  // console.log("레트로핏 잘 된다");
  var district = req.query.district;
  // console.log(req.query.district);
  var sql = 'select * from hospital where address like "%' + district + '%"';
  // console.log(sql);
  connection.query(sql, function(err, rows, fields){
    if(err){
      console.log(err);
    }
    else{
      //console.log('rows', rows);
      res.send(rows);
    }
  });
});
app.get('/everyHospital', function(req, res){
  console.log("모든 병원 뭐가 문젤까");
  // console.log("테스트다.");
  // console.log("모든 병원 테스트");
  var sql = "select * from hospital where address != ''";
  connection.query(sql, function(err, rows, fields){
    if(err){
      console.log(err);
    }
    else{
      //console.log('rows', rows);
      res.send(rows);
    }
  });
});
app.get('/enrollLatLng', function(req, res){
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
    }
    else{
      console.log('result', result);
      res.send(result);
    }
  });
});
app.post('/writeReview', function(req,res) {
  console.log("리뷰 작성 뭐가 문젤까");
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
    }
    else{
      console.log('result', result);
      var WriteResult = { };
      WriteResult["resultCode"] = 200;
      WriteResult["reviewNum"] = result["insertId"];
      res.json(WriteResult);
    }
  });
});
app.get('/review', function(req, res){
  console.log("리뷰 불러오기 문젤까");
  var num = req.query.num;
  // console.log(num);
  var sql = 'select * from review natural join user where hospitalNum = ' + num;
  // console.log(sql);
  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      // console.log('result', result);
      // 등록된 후기가 있으면.
      if(result[0] != null){
        console.log("있다");
        res.send(result);
      }
      // 등록된 후기가 없으면.
      else{
      }
    }
  });
});
app.post('/enrollFavorite', function(req,res) {
  console.log("즐찾 추가 뭐가 문젤까");
  var userId = req.body.userId;
  var num = req.body.num;
  var BaseResult = { };
  // 이미 추가한 즐겨찾기인지 체크해주자.
  var sql = 'select * from favorite where userID = ' + userId + ' and num = ' + num;
  console.log(sql);
  connection.query(sql, function(err, result) {
    if(err){
      console.log(err);
    }
    else{
      // 추가 되어 있는 것이면.
      if(result[0] != null){
        console.log('추가되어있음', result);
        BaseResult["resultCode"] = 2000;
        res.json(BaseResult);
      }
      else{
        console.log('추가되어있지않음', result);
        BaseResult["resultCode"] = 200;
        enrollFavoriteToDB(res, userId, num);
        res.json(BaseResult);
      }
    }
  });
});
app.post('/enrollBlackList', function(req,res) {
  console.log("블랙 추가 뭐가 문젤까");
  var userId = req.body.userId;
  var num = req.body.num;
  var BaseResult = { };
  // 이미 추가한 즐겨찾기인지 체크해주자.
  var sql = 'select * from blacklist where userID = ' + userId + ' and num = ' + num;
  console.log(sql);
  connection.query(sql, function(err, result) {
    if(err){
      console.log(err);
    }
    else{
      // 추가 되어 있는 것이면.
      if(result[0] != null){
        console.log('추가되어있음', result);
        BaseResult["resultCode"] = 2000;
        res.json(BaseResult);
      }
      else{
        console.log('추가되어있지않음', result);
        BaseResult["resultCode"] = 200;
        enrollBlackToDB(res, userId, num);
      }
    }
  });
});
app.post('/writeChart', function (req, res) {
  console.log("차트작성 뭐가 문젤까");
  var petName = req.body.petName;
  var userId = req.body.userId;
  var flag = req.body.flag;
  var treatmentDate = req.body.treatmentDate;
  var reTreatmentDate = req.body.reTreatmentDate;
  var title = req.body.title;
  var description = req.body.description;
  var BaseResult = { };
  // 이미 추가한 즐겨찾기인지 체크해주자.
  var sql = 'insert into chart(petName, userId, flag, treatmentDate, reTreatmentDate, title, description) values ("' + petName + '", ' + userId + ', ' + flag + ', "' + treatmentDate + '", "' + reTreatmentDate + '", "' + title + '", "' + description + '")';
  // console.log(sql);
  connection.query(sql, function(err, result) {
    if(err){
      console.log(err);
    }
    else{
        // console.log('result', result);
        BaseResult["resultCode"] = 200;
        res.json(BaseResult);
    }
  });
});
app.post('/enrollPet', function (req, res) {
  console.log("펫 추가 뭐가 문젤까");
  var name = req.body.name;
  var age = req.body.age;
  var species = req.body.species;
  var userId = req.body.userId;
  var BaseResult = { };
  // 이미 추가한 즐겨찾기인지 체크해주자.
  var sql = 'insert into pet values(' + '"' + name + '", ' + age + ', "' + species + '", ' + userId + ')';
  // console.log(sql);
  connection.query(sql, function(err, result) {
    if(err){
      console.log(err);
    }
    else{
      // console.log('result', result);
      BaseResult["resultCode"] = 200;
      res.json(BaseResult);
    }
  });
});
app.post('/changeAlarmSetting', function (req, res) {
  var BaseResult = { };
  var email = req.body.email;
  var userId = req.body.userId;
  var nickname = req.body.nickname;
  var thumbnailImagePath = req.body.thumbnailImagePath;
  var flag = req.body.flag;
  var notiFlag = req.body.notiFlag;
  // 우선 가입이 되어있는지 확인 해보자.
  var sql = 'update user set notiFlag = ' + notiFlag + ' where userId = ' + userId + " and flag = " + flag;
  // console.log(sql);
  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      BaseResult["resultCode"] = 200;
      res.json(BaseResult);
    }
  });
});
app.get('/getChartList', function (req, res) {
  var userId = req.query.userId;
  var flag = req.query.flag;
  var sql = 'select * from chart where userId = ' + userId + ' and flag = ' + flag;
  //console.log(sql);
  connection.query(sql, function(err, rows, fields){
    if(err){
      console.log(err);
    }
    else{
      // console.log('rows', rows);
      res.send(rows);
    }
  });
});
function enrollUserToServer(res, email, userId, nickname, thumbnailImagePath, flag){
  var sql = 'insert into user values ("' + email + '", ' + userId + ', "' + nickname + '", "' + thumbnailImagePath + '", ' + flag + ')';
  console.log('회원 가입하자');
  console.log(sql);
  connection.query(sql, function (err, result) {
    if(err){
      console.log(err);
    }
    else {
      console.log('result', result);
      var BaseResult = { };
      BaseResult["resultCode"] = 200;
      res.json(BaseResult);
    }
  });
};
function enrollFavoriteToDB(res, userId, num){
  var sql = 'insert into favorite values (' + userId + ', ' + num + ')';
  console.log(sql);
  connection.query(sql, function (err, result) {
    if(err){
      console.log(err);
    }
    else {
      console.log('result', result);
      BaseResult["resultCode"] = 200;
      res.json(BaseResult);
    }
  });
};
function enrollBlackToDB(res, userId, num){
  // num은 병원 번호.
  var sql = 'insert into blacklist values (' + userId + ', ' + num + ')';
  console.log(sql);
  connection.query(sql, function (err, result) {
    if(err){
      console.log(err);
    }
    // 여기서 Hospital table의 blackCount도 1 증가시켜주자.
    else {
      var sql = 'update hospital set blackcount = blackcount + 1 where num = ' + num;
      connection.query(sql, function (err, result) {
        if(err){
          console.log(error);
        }
        else{
          console.log('result', result);
          BaseResult["resultCode"] = 200;
          res.json(BaseResult);
        }
      });
    }
  });
};
