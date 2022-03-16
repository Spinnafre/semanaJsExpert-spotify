import server from './server.js'

server.listen(3333)
.on('listening',()=>{
    console.log('running in http://localhost:3333')
})