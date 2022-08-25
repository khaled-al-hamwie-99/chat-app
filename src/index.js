const express = require('express')
const http = require('http')
const path = require('path')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/message')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = 3000
const publicDirPath = path.join(__dirname, '../public')
app.use(express.static(publicDirPath))
io.on('connection', (socket) => {
    console.log('new web socket connection')

    socket.on('join', (Options, callback) => {
        const user = addUser({ id: socket.id, ...Options })
        if (user.error) {
            return callback(user.error)
        }
        socket.join(user.room)
        socket.emit('message', generateMessage("Admin", "welcome"))
        socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has join`))
        io.to(user.room).emit('roomDate', {
            room: user.room
            , users: getUsersInRoom(user.room)
        })
        callback()
    })
    socket.on('chat-message', (message, callback) => {
        const user = getUser(socket.id)
        const filter = new Filter()
        if (filter.isProfane(message)) {
            return callback('profanity is not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username, message))
        callback()
    })
    socket.on('share-location', ({ lat, lon }, callback) => {
        if (!lat || !lon)
            return callback("something rong happend")
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://google.com/maps?q=${lat},${lon}`))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            socket.broadcast.to(user.room).emit('message', generateMessage("Admin", `${user.username} has left`))
            io.to(user.room).emit('roomDate', {
                room: user.room
                , users: getUsersInRoom(user.room)
            })
        }
    })
})
server.listen(port, () => {
    console.log(`app listening on ${port}`)
})