// * 카페 API 사용을 위해서는, 먼저 네이버 아이디로 로그인 적용이 필요합니다.
// * 처리한도 : 카페 가입: 50건/일 (네이버 계정당, 각 계정별 총 카페 300개 까지 가입 가능)
// * 처리한도 : 카페 글쓰기: 200건/일 (네이버 계정당)
var express = require('express');
var app = express();
var request = require('request');

var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
// app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(bodyParser.urlencoded({limit: '500mb', extended: true, parameterLimit: 10000000}));

var client_config  = require('./config/client-config.json');
var client_id = client_config.client_id;
var client_secret = client_config.client_secret;
var state = "RAMDOM_STATE";
var redirectURI = encodeURI(client_config.callback_url);
var api_url = "";
var datalab_api_url = "";

var token = "YOUR_ACCESS_TOKEN";
var refresh_token = "YOUR_REFRESH_TOKEN";
var header = ""; // Bearer 다음에 공백 추가


app.get('/naverlogin', function (req, res) {
  api_url = 'https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=' + client_id + '&redirect_uri=' + redirectURI + '&state=' + state;
  res.writeHead(200, {'Content-Type': 'text/html;charset=utf-8'});
  res.end("<a href='"+ api_url + "'><img height='50' src='http://static.nid.naver.com/oauth/small_g_in.PNG'/></a>");
});
app.get('/callback', function (req, res) {
  code = req.query.code;
  state = req.query.state;
  api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id='
      + client_id + '&client_secret=' + client_secret + '&redirect_uri=' + redirectURI + '&code=' + code + '&state=' + state;

  var options = {
    url: api_url,
    headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      console.log(body);
      console.log(typeof body);
      if(JSON.parse(body)){
        token = JSON.parse(body).access_token;
        refresh_token = JSON.parse(body).refresh_token;
        header = "Bearer " + token;

      }
      res.end(body);
    } else {
      res.status(response.statusCode).end();
      console.log('error = ' + response.statusCode);
    }
  });
});

app.get('/refreshtoken', function (req, res) {
  code = req.query.code;
  state = req.query.state;
  api_url = 'https://nid.naver.com/oauth2.0/token?grant_type=refresh_token&&client_id='
      + client_id + '&client_secret=' + client_secret + '&refresh_token=' + refresh_token;

  var options = {
    url: api_url,
    headers: {'X-Naver-Client-Id':client_id, 'X-Naver-Client-Secret': client_secret}
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      console.log(body);
      console.log(typeof body);
      if(JSON.parse(body)){
        token = JSON.parse(body).access_token;
        header = "Bearer " + token;

      }
      res.end(body);
    } else {
      res.status(response.statusCode).end();
      console.log('error = ' + response.statusCode);
    }
  });
});

app.get('/member', function (req, res) {
  var api_url = 'https://openapi.naver.com/v1/nid/me';
  var options = {
    url: api_url,
    headers: {'Authorization': header}
  };
  request.get(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      res.end(body);
    } else {
      console.log('error');
      if(response != null) {
        res.status(response.statusCode).end();
        console.log('error = ' + response.statusCode);
      }
    }
  });
});


// var clubid = "CLUB_ID";// 카페의 고유 ID값
// var menuid = "MENU_ID"; // 카페 게시판 id (상품게시판은 입력 불가)
// var subject = encodeURI("네이버 카페 api Test node js");
// var content = encodeURI("네이버 카페 api로 글을 카페에 글을 올려봅니다.");
app.post('/cafe/post', function (req, res) {
  var api_url = 'https://openapi.naver.com/v1/cafe/' + req.body.clubid + '/menu/' + req.body.menuid + '/articles';
  var options = {
    url: api_url,
    form: {'subject':req.body.subject, 'content':req.body.content},
    headers: {'Authorization': header}
  };
  request.post(options, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
      res.end(body);
    } else {
      console.log('error');
      if(response != null) {
        res.status(response.statusCode).end();
        console.log('error = ' + response.statusCode);
      }
    }
  });
});


// var clubid = "YOUR_CAFE_ID";// 카페의 고유 ID값
// var menuid = "YOUR_CAFE_BBS_ID"; // 카페 게시판 id (상품게시판은 입력 불가)
// var subject = encodeURI("네이버 카페 api Test node js");
// var content = encodeURI("node js multi-part 네이버 카페 api로 글을 카페에 글을 올려봅니다.");
var fs = require('fs');
app.post('/cafe/post/multipart', function (req, res) {
  var api_url = 'https://openapi.naver.com/v1/cafe/' + req.body.clubid + '/menu/' + req.body.menuid + '/articles';
  var _formData = {
    subject:req.body.subject,
    content:req.body.content,
    image: [
      {
        value: fs.createReadStream(req.body.filepath),
        options: { filename: req.body.filename,  contentType: 'image/png'}
      }
    ]
  };
  var _req = request.post({url:api_url, formData:_formData,
    headers: {'Authorization': header}}).on('response', function(response) {
    console.log(response.statusCode) // 200
    console.log(response.headers['content-type'])
  });
  console.log( request.head  );
  _req.pipe(res); // 브라우저로 출력
});

app.post('/datalab/search', function (req, res) {
  var request_body = {
    "startDate": req.body.startDate, //"2017-01-01",
    "endDate": req.body.endDate, //"2017-04-30",
    "timeUnit": req.body.timeUnit, //"month",
    "keywordGroups": req.body.keywordGroups, // [{"groupName": "한글", "keywords": ["한글"]}, {"groupName": "영어", "keywords": ["영어"]}]
    "device": req.body.device, //"pc",
    "ages": req.body.ages, // ["1","2"]
    "gender": req.body.gender // f
  };
  datalab_api_url = 'https://openapi.naver.com/v1/datalab/search';
  request.post({
        url: datalab_api_url,
        body: JSON.stringify(request_body),
        headers: {
          'X-Naver-Client-Id': client_id,
          'X-Naver-Client-Secret': client_secret,
          'Content-Type': 'application/json'
        }
      },
      function (error, response, body) {
        if (!error && response.statusCode == 200) {
          res.writeHead(200, {'Content-Type': 'text/json;charset=utf-8'});
          res.end(body);
        } else {
          console.log('error');
          if(response != null) {
            res.status(response.statusCode).end();
            console.log('error = ' + response.statusCode);
          }
        }
      });

});

app.listen(3000, function () {
  console.log('http://127.0.0.1:3000/naverlogin app listening on port 3000!');
});

