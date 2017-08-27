const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const router = express.Router();
const fs = require('fs');

const mysql = require('mysql');
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use('/', router);

app.get('/', function(req, res){
  console.log("테스트");
});

// const upload = multer({ dest: 'uploads/'});

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
    else{

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
  var sql = 'select num, name, address, tel, latitude, longitude, blackcount, rating_count, rating_sum, rating_avg, imgPath, GROUP_CONCAT(species separator ", ") as species from  hospital left outer join department on hospital.num = department.hospitalNum where address like "%' + district + '%" group by num';

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

app.get('/getSpecies', function(req, res){

  var num = req.query.num;

  var sql = "select species from hospital natural join department where hospital.num = department.hospitalNum and hospital.num = " + num;
  console.log("과목 가져오자", sql);

  connection.query(sql, function(err, rows, fields){
    if(err){
      console.log(err);
    }
    else{
      var SpeciesResult = { };
      SpeciesResult["resultCode"] = 200;
      SpeciesResult["species"] = rows;
      if(rows[0] != null){
        // console.log("병원 번호", num);
        // console.log("rows", rows);
      }
      res.json(SpeciesResult);
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
        res.send(result);
      }
    }
  });
});

app.post('/enrollFavorite', function(req,res) {
  console.log("즐찾 추가 뭐가 문젤까");
  var userId = req.body.userId;
  var flag = req.body.flag;
  var num = req.body.num;

  var BaseResult = { };

  // 블랙리스트에 추가되어 있는 건지 확인 해주자.
  var sql = 'select * from black where userID = ' + userId + ' and flag = ' + flag + ' and num = ' + num;
  connection.query(sql, function(err, result) {
    if(err){
      console.log(err);
    }
    else{
      // 블랙 리스트에 추가 되어 있는 것이면.
      if(result[0] != null){
        console.log('즐찾에 추가하려는데 블랙리스트에 추가되어있음', result);
        BaseResult["resultCode"] = 300;
        res.json(BaseResult);
      }
      else{
        var sql = 'select * from favorite where userID = ' + userId + ' and flag = ' + flag + ' and num = ' + num;
        connection.query(sql, function(err, result) {
          if(err){
            console.log(err);
          }
          else{
            // 추가 되어 있는 것이면.
            if(result[0] != null){
              console.log('이미 추가된 즐찾', result);
              BaseResult["resultCode"] = 2000;
              res.json(BaseResult);
            }
            else{
              console.log('추가되어있지않음', result);
              BaseResult["resultCode"] = 200;
              enrollFavoriteToDB(res, userId, flag, num);
            }
          }
        });
      }
    }
  })

  // 이미 추가한 즐겨찾기인지 체크해주자.

});

app.get('/getFavoriteList', function(req, res){
  var userId = req.query.userId;
  var flag = req.query.flag;

  var sql = 'select * from hospital natural join favorite where hospital.num = favorite.num and userId = ' + userId + ' and flag = ' + flag;

  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
        res.send(result);
    }
  });
});

app.post('/enrollBlack', function(req,res) {
  console.log("블랙 추가 뭐가 문젤까");

  var userId = req.body.userId;
  var flag = req.body.flag;
  var num = req.body.num;

  var BaseResult = { };

  // 즐겨찾기에 추가 되어 있는 병원인지 체크해 주자.
  var sql = 'select * from favorite where userID = ' + userId + ' and flag = ' + flag + ' and num = ' + num;
  connection.query(sql, function(err, result) {
    if(err){
      console.log(err);
    }
    else{
      // 즐겨찾기에 추가 되어 있는 것이면.
      if(result[0] != null){
        console.log('블랙리스트에 추가하려는데 즐찾에 추가되어있음', result);
        BaseResult["resultCode"] = 300;
        res.json(BaseResult);
      }
      else{
        var sql = 'select * from black where userID = ' + userId + ' and flag = ' + flag + ' and num = ' + num;
        connection.query(sql, function(err, result) {
          if(err){
            console.log(err);
          }
          else{
            // 추가 되어 있는 것이면.
            if(result[0] != null){
              BaseResult["resultCode"] = 2000;
              res.json(BaseResult);
            }
            else{
              BaseResult["resultCode"] = 200;
              enrollBlackToDB(res, userId, flag, num);
            }
          }
        });
      }
    }
  });

  // 이미 추가한 즐겨찾기인지 체크해주자.

});

app.get('/getBlackList', function(req, res){
  var userId = req.query.userId;
  var flag = req.query.flag;

  var sql = 'select * from hospital natural join black where hospital.num = black.num and userId = ' + userId + ' and flag = ' + flag;
  console.log(sql);

  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
        res.send(result);
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
  var imagePath = req.body.imagePath;
  var flag = req.body.flag

  var BaseResult = { };
  var sql = 'select * from pet where name = "' + name + '" and userId = ' + userId + ' and flag = ' + flag;
  connection.query(sql, function (err, result) {
    if(err){
      console.log(err);
    }
    else{
      // 등록한 펫이 있음.
      if(result[0] != null){
          BaseResult["resultCode"] = 300;
          res.json(BaseResult);
      }
      else{
        var sql = 'insert into pet values(' + '"' + name + '", ' + age + ', "' + species + '", ' + userId + ', "' + imagePath + '", ' + flag + ')';
        console.log(sql);
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
      }
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

  var sql = 'select * from chart where userId = ' + userId + ' and flag = ' + flag + ' order by treatmentDate desc';
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

app.get('/getPetList', function (req, res) {

  var userId = req.query.userId;
  var flag = req.query.flag;

  var sql = 'select * from pet where userId = ' + userId + ' and flag = ' + flag;
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

app.get('/getPetImage', function (req, res) {

  // console.log("펫 이미지 가져오자");
  var filePath = req.query.filePath;
  // console.log(filePath);

  fs.exists(filePath, function(exists){
    if(exists){
      var readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    }
    else{
      res.end("File does Not Exists");
    }
  });

  // var sql = 'select * from pet where userId = ' + userId + ' and flag = ' + flag;
  // //console.log(sql);
  //
  // connection.query(sql, function(err, rows, fields){
  //   if(err){
  //     console.log(err);
  //   }
  //   else{
  //     // console.log('rows', rows);
  //     res.send(rows);
  //   }
  // });
});

app.get('/ratingHospital', function (req, res) {

  var BaseResult = { };

  var num = req.query.num;
  console.log(num);
  var rating = req.query.rating;
  console.log(rating);

  // 우선 가입이 되어있는지 확인 해보자.
  var sql = 'update hospital set rating_count = rating_count + 1, rating_sum = rating_sum + ' + rating + ", rating_avg = rating_sum/rating_count where num = " + num;
  console.log(sql);
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

app.get('/checkAddedFavorite', function (req, res) {

  var BaseResult = { };

  var num = req.query.num;
  var userId = req.query.userId;
  var flag = req.query.flag;

  var sql = 'select * from favorite where num = ' + num + ' and userId = ' + userId + ' and flag = ' + flag;
  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      // 즐겨찾기에 추가되어 있는 병원이면.
      if(result[0] != null){
        BaseResult["resultCode"] = 200;
      }
      else{
        BaseResult["resultCode"] = 300;
      }
      res.json(BaseResult);
    }
  });
});

app.get('/checkAddedBlack', function (req, res) {

  var BaseResult = { };

  var num = req.query.num;
  var userId = req.query.userId;
  var flag = req.query.flag;

  // 우선 가입이 되어있는지 확인 해보자.
  var sql = 'select * from black where num = ' + num + ' and userId = ' + userId + ' and flag = ' + flag;
  console.log(sql);
  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      // 블랙 리스트에 추가되어 있는 병원.
      if(result[0] != null){
        BaseResult["resultCode"] = 200;
      }
      else{
        BaseResult["resultCode"] = 300;
      }
      res.json(BaseResult);
    }
  });
});

app.get('/deleteFavorite', function (req, res) {

  var BaseResult = { };

  var num = req.query.num;
  var userId = req.query.userId;
  var flag = req.query.flag;

  // 우선 가입이 되어있는지 확인 해보자.
  var sql = 'delete from favorite where num = ' + num + ' and userId = ' + userId + ' and flag = ' + flag;
  console.log(sql);
  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      console.log('있으니까 삭제해주자.');
      BaseResult["resultCode"] = 200;
      res.json(BaseResult);
    }
  });
});

app.get('/deleteBlack', function (req, res) {

  var BaseResult = { };

  var num = req.query.num;
  var userId = req.query.userId;
  var flag = req.query.flag;

  // 우선 가입이 되어있는지 확인 해보자.
  var sql = 'delete from black where num = ' + num + ' and userId = ' + userId + ' and flag = ' + flag;
  console.log(sql);
  connection.query(sql, function(err, result){
    if(err){
      console.log(err);
    }
    else{
      var sql = 'update hospital set blackcount = blackcount - 1 where num = ' + num;
      connection.query(sql, function (err, result) {
        if(err){
          console.log(error);
        }
        else{
          BaseResult["resultCode"] = 200;
          res.json(BaseResult);
        }
      });
    }
  });
});

app.get('/modifyPet', function (req, res) {
  var BaseResult = { };

  var petName = req.query.petName;
  var age = req.query.age;
  var userId = req.query.userId;
  var flag = req.query.flag;
  var imagePath = req.query.imagePath;

  var sql = 'update pet set age = ' + age + ', imagePath = "' + imagePath + '" where name = "' + petName + '" and userId = ' + userId + ' and flag = ' + flag;
  console.log(sql);
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

app.get('/deletePet', function (req, res) {
  var BaseResult = { };

  var petName = req.query.petName;
  var userId = req.query.userId;
  var flag = req.query.flag;

  var sql = 'delete from pet where name = "' + petName + '" and userId = ' + userId + ' and flag = ' + flag;
  console.log(sql);
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

var storage = multer.diskStorage({
  destination: './uploads',
  filename: function(req, file, cb) {
    return crypto.pseudoRandomBytes(16, function(err, raw) {
      if (err) {
        console.log(err);
        return cb(err);
      }
      console.log("만들어짐");
      return cb(null, "" + (raw.toString('hex')) + (path.extname(file.originalname)));
    });
  }
});

var upload = multer({ storage: storage });

app.use(multer);
router.post('/addPetImage', upload.single('upload'), function(req, res) {
  console.log("받아와야지..");
  console.log(req.file);
  // console.log("path", req.file.path);
  // console.log(typeof(imagePath));
  console.log(req.body);

  var jsonObject = req.body.json;

  var petString = JSON.parse(jsonObject);
  var key = Object.keys(petString)[0];

  var pet = petString[key];
  var age = pet["age"];
  var name = pet["name"];
  var species = pet["species"];
  var userId = pet["userId"];
  var imagePath = req.file["path"].replace('\\', '\\\\');
  console.log(imagePath);
  var flag = pet["flag"];

  var sql = 'insert into pet values(' + '"' + name + '", ' + age + ', "' + species + '", ' + userId + ', "' + imagePath + '", ' + flag + ')';
  // console.log(sql);

  connection.query(sql, function(err, result) {
    if(err){
      console.log(err);
    }
    else{
      // console.log('result', result);
      return res.status(204).end();
    }
  });

});


function enrollUserToServer(res, email, userId, nickname, thumbnailImagePath, flag){
  var sql = 'insert into user values ("' + email + '", ' + userId + ', "' + nickname + '", "' + thumbnailImagePath + '", ' + flag + ', 0' + ')';
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

function enrollFavoriteToDB(res, userId, flag, num){
  var sql = 'insert into favorite values (' + userId + ', ' + flag + ', ' + num + ')';
  console.log(sql);
  var BaseResult = {};
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

function enrollBlackToDB(res, userId, flag, num){
  // num은 병원 번호.
  var sql = 'insert into black values (' + userId + ', ' + flag + ', '+ num + ')';
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
          var BaseResult = { };
          BaseResult["resultCode"] = 200;
          res.json(BaseResult);
        }
      });
    }
  });
};

app.listen(port, function(){
  console.log('Connected 3000 port!');
});
