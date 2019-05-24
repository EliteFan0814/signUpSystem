// #!/usr/bin/env node
var http = require('http')
var fs = require('fs')
var url = require('url')

var port = process.env.port || 5555;
var sessions = {}
var server = http.createServer(function (request, response) {

    var temp = url.parse(request.url, true)
    var path = temp.pathname
    var query = temp.query
    var method = request.method

    if (path === '/') {
        // console.log(request.headers)
        var string = fs.readFileSync('./index.html', 'utf-8')
        let query_session = sessions[query.sessionId] // {sign_in_email: 'fan552426811@outlook.com'}
        console.log('query_session 值为：')
        console.log(query_session)
        if (query_session !== undefined) {
            string = string.replace('___acount___', query_session.sign_in_email)
        } else {
            string = string.replace('___acount___', '未登录，<a href="/sign_in">请登录</a> 或 <a href="/sign_up">注册</a>')
        }
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/css/sign.css') {
        var string = fs.readFileSync('./css/sign.css', 'utf-8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/css')
        response.write(string)
        response.end()
    } else if (path === '/sign_in') {
        var string = fs.readFileSync('./sign_in.html', 'utf-8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/signin_notby_cookie' && method.toUpperCase() === 'POST') {
        getBody(request).then((body) => {
            response.setHeader('Content-Type', 'application/json;charset=utf-8')
            let result = transToObject(body, '&')
            console.log('当前登陆账户为：')
            console.log(result)
            let { email, password } = result
            if (email.indexOf('@') === -1) {
                response.statusCode = 400
                response.write('{"errors":"来自后端：email error"}')
            } else {
                let users = fs.readFileSync('./db/users', 'utf-8')
                users = JSON.parse(users)
                let pass = false
                for (let i = 0; i < users.length; i++) {
                    let user = users[i]
                    if (user.email === email && user.password === password) {
                        pass = true
                        break
                    }
                }
                if (pass) {
                    let sessionId = Math.random() * 1000000
                    sessions = {}
                    sessions[sessionId] = { sign_in_email: email }
                    console.log('sessions为：')
                    console.log(sessions)
                    response.statusCode = 200
                    response.write('{"sessionId":' + sessionId + '}')
                } else {
                    response.statusCode = 400
                    response.write('{"errors":"来自后端：账号不存在或密码不匹配！"}')
                }
            }
            response.end()
        })
    } else if (path === '/signout') {
        sessions = {}
        response.statusCode = 200
        response.setHeader('Content-Type', 'application/json;charset=utf-8')
        response.write('{"success":"来自后端：退出成功"}')
        response.end()
    } else if (path === '/sign_up') {
        var string = fs.readFileSync('./sign_up.html', 'utf-8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/signup' && method.toUpperCase() === 'POST') {
        getBody(request).then((body) => {
            response.setHeader('Content-Type', 'application/json;charset=utf-8')
            let result = transToObject(body, '&')
            console.log('注册信息为：')
            console.log(result)
            let { email, password, confirmpsd } = result
            if (email.indexOf('@') === -1 || password !== confirmpsd) {
                response.statusCode = 400
                response.write('{"errors":"来自后端：email error or password error"}')
            } else {
                let users = fs.readFileSync('./db/users', 'utf-8')
                // 解析JSON字符串为js对象
                users = JSON.parse(users)
                let pass = true
                for (let i = 0; i < users.length; i++) {
                    if (users[i].email === email) {
                        pass = false
                        break
                    }
                }
                if (pass) {
                    users.push({ email: email, password: password })
                    // js对象转化为JSON
                    let userstring = JSON.stringify(users)
                    fs.writeFileSync('./db/users', userstring)
                    response.statusCode = 200
                    response.write('{"success":"regist success!"}')
                } else {
                    response.statusCode = 400
                    response.write('{"errors":"来自后端：账户已存在！"}')
                }
            }
            response.end()
        })
    } else {
        response.statusCode = 404
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write('找不到路径')
        response.end()
    }
    console.log(method + ' ' + request.url)
})

function getBody(request) {
    return new Promise((resolve, reject) => {
        let body = []
        request.on('data', (chunk) => {
            body.push(chunk)
        }).on('end', () => {
            body = Buffer.concat(body).toString()
            resolve(body)
        })
    })
}

function transToObject(body, separator) {
    let result = {}
    let arr = decodeURIComponent(body).split(separator)
    arr.forEach(element => {
        let parts = element.split('=')
        let key = parts[0]
        let value = parts[1]
        result[key] = value
    })
    return result
}
server.listen(port)
console.log('(session 版本 server)监听 ' + port + '成功，请打开 http://localhost:' + port)