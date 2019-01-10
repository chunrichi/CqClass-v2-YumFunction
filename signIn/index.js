// 云函数入口文件
const cloud = require('wx-server-sdk')
var rp = require('request-promise');

// 开启 request-promise 的 cookies记录
const api_url = 'http://39.107.243.115';
var cookiejar = rp.jar();
// cookiejar.setCookie(cookie, api_url); //请求api_url的所有cookies
rp = rp.defaults({
  jar: cookiejar
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
    await rp({
      uri: api_url + '/wc/CqClassBox/lei',
      method: 'POST',
      formData: {
        pw: '0005f2d9c91740c4af7114db2346004c'
      },
      jar: cookiejar
    })

    // 请求 爬虫
    await rp({
      url: api_url + '/wechart/CqClassBox/login',
      method: 'POST',
      formData: {
        username: username,
        password: username
      },
      jar: cookiejar
    }).then(body => {
      console.log('\n\n\nbody', body)
      userMessage = JSON.parse(body)
    }).catch(error => {
      userMessage.messageStatus = false
      userMessage.errorMessage = 'request api error'
    })

    // 如果获取成功
    if (userMessage.messageStatus) {
      // 存储信息
      // 将个人信息存储进 kb_users 中
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
      // 将课表信息添加进 kb_classtables 中
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