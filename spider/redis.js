const Redis = require("ioredis")
const myredis = new Redis({
  port: 6379,
  host: '127.0.0.1',
  family: 4,
  password: 'auth',
  db: 2
})
const http = require('http')

const getList = async () => {
  const list = await myredis.lrange('phoneModel1', 0, -1)
  const data = {}
  for (const item of list) {
    Object.assign(data, JSON.parse(item))
  }
  return data
}

getList()

http.createServer(async (request, response) => {
  response.writeHead(200, {'Content-Type': 'text/plain'})
  response.end(JSON.stringify(await getList()))
}).listen(8088)
