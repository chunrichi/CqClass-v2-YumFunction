// 云函数入口文件
const cloud = require('wx-server-sdk')
var rp = require('request-promise');

// 开启 request 的 cookies记录
// var request = request.defaults({jar: true})
var j = request.jar()
var request = request.defaults({
  jar: j
})

cloud.init()

// 云函数入口函数
exports.main = async(event, context) => {
  // 数据库
  const db = cloud.database()

  // 输入 账号 密码
  var username = event.uid;
  var password = event.pwd;
  var term = event.term;

  // 查询是否已经有过该用户的课表
  var ifHavaTheUser = false;
  await db.collection('kb_users').where({
      uid: username
    }).get()
    .then(result => {
      var resultData = result.data;
      if (resultData.length != 0) {
        ifHavaTheUser = true
      }
    })

  // 存储信息
  var userMessage = {};

  // 返回状态
  var messageStatus = true;

  // 没有该用户 则直接请求 API
  if (!ifHavaTheUser) {
    // 登录 服务器
    const api_url = 'http://39.107.243.115';
    request({
      url: api_url + '/wc/CqClassBox/lei',
      method: 'POST',
      formData: {
        pw: '0005f2d9c91740c4af7114db2346004c'
      }
    })
    // 请求 爬虫
    request({
      url: api_url + '/wechart/CqClassBox/login',
      method: 'POST',
      formData: {
        username: username,
        password: username
      }
    }, function(error, response, body) {
      console.log('\n\n\nbody', body)
      userMessage = JSON.parse(body)
    })
    // 如果获取成功
    if (userMessage.messageStatus) {
      // 存储信息
      await db.collection('kb_users').add({
        // data 字段表示需新增的 JSON 数据
        data: {
          uid: username,
          grade: userMessage.studentMessage.grade,
          gradeClass: userMessage.studentMessage.gradeClass,
          major: userMessage.studentMessage.major,
          sex: userMessage.studentMessage.sex,
          studentName: userMessage.studentMessage.studentName,
        }
      })
      await db.collection('kb_classtables').add({
        data: {
          uid: username,
          classMessages: {
            term: term,
            termClassTables: [
              userMessage.studentMessage.classMessage
            ]
          }
        }
      })
    } else {
      messageStatus = false
    }
  } else {
    // 有该用户则
  }
  console.log(userMessage)

  const wxContext = cloud.getWXContext()

  return {
    messageStatus,
    userMessage,
    event,
    openid: wxContext.OPENID,
    appid: wxContext.APPID,
    unionid: wxContext.UNIONID,
  }
}