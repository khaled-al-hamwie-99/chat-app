const socket = io()
//element
const $form = document.querySelector('#send-massege')
const $messageBtn = $form.querySelector('#send')
const $messageInput = $form.querySelector('[type="text"]')
const $locationBtn = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
const $sidebar = document.querySelector('#sidebar')
//template
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationMessageTemplate = document.querySelector('#message-location-template')
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

$form.addEventListener('click', (e) => {
    e.preventDefault()
    if ($messageInput.value) {
        socket.emit('chat-message', $messageInput.value, (error) => {
            if (error) {
                return console.log(error)
            }
            console.log('message deliver')
        })
        $messageInput.value = ""
        $messageInput.focus()
    }
})
const autoscroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild
    // height of a new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    //visible height
    const visibleHeight = $messages.offsetHeight

    //height of messages container
    const containerHeight = $messages.scrollHeight

    //how far have i scrolled 
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on("message", (message) => {
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('locationMessage', (location) => {
    const html = Mustache.render(locationMessageTemplate.innerHTML, {
        username: location.username,
        url: location.text,
        createdAt: moment(location.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomDate', (options) => {
    const html = Mustache.render(sidebarTemplate, {
        room: options.room
        , users: options.users
    })
    $sidebar.innerHTML = html
})

$locationBtn.addEventListener('click', () => {
    if (!navigator.geolocation)
        return console.log('geo location is not supported by your browse')
    $locationBtn.setAttribute('disabled', 'disabled')
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('share-location', { lat: position.coords.latitude, lon: position.coords.longitude }, (error) => {
            if (error)
                console.log(error)
            $locationBtn.removeAttribute('disabled')
        })
    })
})


socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})