// 云函数入口文件
const cloud = require('wx-server-sdk')
var request = require('request');
// 开启 request 的 cookies记录
// var request = request.defaults({jar: true})
var j = request.jar()
var request = request.defaults({
  jar: j
})
cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  const wxContext = cloud.getWXContext()

  var username = event.uid;
  const db = cloud.database()
  var dblog = null
  var ifHavaTheUser = false;
  await db.collection('kb_users').where({
      uid: username
    }).get()
    .then(result => {
      dblog = result.data
      var resultData = result.data;
      if (resultData.length != 0) {
        ifHavaTheUser = true
      }
    })
  console.log('dblog:', dblog)

  var userMessage = 'null';
  const api_url = 'http://39.107.243.115';

  await request({
    url: api_url + '/wc/CqClassBox/lei',
    method: 'POST',
    formData: {
      pw: '0005f2d9c91740c4af7114db2346004c'
    }
  }, function (error, response, body) {
    // 登录成功返回
    userMessage = body;
    // userMessage = JSON.parse(body)
    console.log('body', body)
  })

  return {
    userMessage,
    ifHavaTheUser,
    dblog,
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}