const http = require('http')

const server=http.createServer((req,res)=>{
  console.log("inside server");
  res.end("welcome to the server side")
})

server.listen(5000,'127.0.0.1',()=>{
  console.log("listening to request on port 5000");
})