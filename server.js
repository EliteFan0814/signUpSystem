// #!/usr/bin/env node
var http = require('http')
var fs = require('fs')
var url = require('url')

var port = process.env.port || 5555;
var server = http.createServer(function (request, response) {

    var temp = url.parse(request.url, true)
    var path = temp.pathname
    var query = temp.query
    var method = request.method

    if (path === '/') {
        var string = fs.readFileSync('./index.html', 'utf-8')
        var amount = fs.readFileSync('./db', 'utf-8')
        string = string.replace('&&&amount&&&', amount)
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/css/signup.css') {
        var string = fs.readFileSync('./css/signup.css', 'utf-8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/css')
        response.write(string)
        response.end()
    } else if (path === '/sign_up') {
        var string = fs.readFileSync('./sign_up.html', 'utf-8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/html;charset=utf-8')
        response.write(string)
        response.end()
    } else if (path === '/signup' && method.toUpperCase() === 'POST') {
        getBody(request).then((body)=>{
            let result = {}
            let arr = decodeURIComponent(body).split('&')
            arr.forEach(element => {
                let parts = element.split('=')
                let key = parts[0]
                let value = parts[1]
                result[key] = value
            })
            console.log(result)
            let { email, password, confirmpsd } = result
            if (email.indexOf('@') === -1 || password !== confirmpsd) {
                response.statusCode = 400
                response.setHeader('Content-Type', 'application/json;charset=utf-8')
                response.write('{"errors":"来自后端：email error or password error"}')
            } else {
                let users = fs.readFileSync('./db/users','utf8')
                users = JSON.parse(users)
                users.push({email:email,password:password})
                let userstring = JSON.stringify(users)
                fs.writeFileSync('./db/users',userstring)
                console.log(userstring)
                response.statusCode = 200
                response.setHeader('Content-Type', 'application/json;charset=utf-8')
                response.write('{"success":"regist success!"}')
            }
            response.end()
        })

        // let body = []
        // request.on('data', (chunk) => {
        //     body.push(chunk)
        // }).on('end', () => {
        //     body = Buffer.concat(body).toString()
        //     let result = {}
        //     let arr = body.split('&')
        //     arr.forEach(element => {
        //         let parts = element.split('=')
        //         let key = parts[0]
        //         let value = parts[1]
        //         result[key] = value
        //     })
        //     let { email, password, confirmpsd } = result
        //     if (email.indexOf('%4') === -1 || password !== confirmpsd) {
        //         response.statusCode = 400
        //         response.setHeader('Content-Type', 'application/json;charset=utf-8')
        //         response.write('{"errors":"email error or password error"}')
        //     } else {
        //         response.statusCode = 200
        //         response.setHeader('Content-Type', 'application/json;charset=utf-8')
        //         response.write('{"success":"regist success!"}')
        //     }
        //     response.end()
        // })
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
server.listen(port)
console.log('监听 ' + port + '成功，请打开 http://localhost:' + port)