document.getElementById("postAuth").style.display = "none"

const version = "Version: 0.3.6"

console.log(version)
document.getElementById('version').innerText = version
document.getElementById('preAuthVersion').innerText = version

const { hostname, port, cookieName } = require('../config.json')

console.log("Renderer Loaded")
const https = require('https')
const schedule = require("node-schedule")
const { ipcRenderer } = require('electron');
const ElectronTitlebarWindows = require('electron-titlebar-windows');
let $ = jQuery = require('jquery')
const fs = require('fs')

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0


const clientID = randomBetween(0, 999999999999)
console.log("Client: " + clientID)

function initTitlebar() {
    console.log("Init Titlebar")
    const titlebar = new ElectronTitlebarWindows({
        draggable: true
    })
    titlebar.appendTo(document.getElementById("titlebar"))
    titlebar.on('close', () => {
        ipcRenderer.send('app:quit')
    })
    titlebar.on('minimize', () => {
        ipcRenderer.send('app:minimize')
    })
    
}

ipcRenderer.on('update_available', () => {
    console.log("Downloading Update")
    ipcRenderer.removeAllListeners('update_available');
});

ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    const NOTIFICATION_TITLE = 'Update Available'
    const NOTIFICATION_BODY = 'Click this notification to update'

    new Notification(NOTIFICATION_TITLE, { body: NOTIFICATION_BODY }).onclick = () => ipcRenderer.send('restart_app');
});

document.getElementById("authenticateBtn").onclick = async function() {
   
    ipcRenderer.send('authenticateBtn', clientID)
    
}

function isAuthenticated() {
     try {
        fs.readFileSync('./cookie.json')
        return true
    } catch (err) {
        return false
    }
}

ipcRenderer.on('Authenticated', async () => {
    console.log("Authenticated")
    initSchedule()
    
    setTimeout(() => {
        fetchData()
    }, 300);

})

function uninstall() {
    if (confirm('Are you sure that you want to uninstall?')) {
        ipcRenderer.send('uninstall')
    }
}

function initSchedule() {
    console.log('starting fetch shedule')
    const cronShedule = JSON.stringify(randomBetween(1 , 59)) + ' * * * * *'
    console.log(cronShedule)
    global.job = schedule.scheduleJob(cronShedule, function(){
        fetchData()
    })
    schedule.scheduleJob('*/1 * * * * *', function(){
        const nextInvoation = job.nextInvocation().getTime()
        const difference =  Math.round((nextInvoation - new Date().getTime()) / 1000)
        document.getElementById('refreshBtn').innerText = "Refresh (" + difference + ")"
    })
    
}

function httpCookieGet(path, cb) {
    buttonsControl(false)
    const cookie = JSON.parse(fs.readFileSync('./cookie.json'))

    let header = {
        'Cookie': cookie.name + '=' + cookie.value
    }

    var options = {
        hostname: hostname,
        port: port,
        path: path,
        method: 'GET',
        headers: header,
    }

    var results = ''
    var req = https.request(options, function (res) {
        res.on('data', function (chunk) {
            results = results + chunk
        })
        res.on('end', function () {
            buttonsControl(true)
            cb(JSON.parse(results))
        })
    })

    req.on('error', function (e) {
        console.log(e)
        buttonsControl(true)
    })

    req.end()
}

async function fetchData() {
    buttonsControl(false)
    document.getElementById("statusText").innerHTML = "Contacting Server";
    httpCookieGet('/fetch', function(data) {
        updatePage(data)
    })
    
}

async function search(phrase) {
    httpCookieGet('/search?search=' + JSON.stringify(phrase), function(data) {
        fetchData()
    })
    
}

async function skip() {
    httpCookieGet('/skip', function(data) {
        fetchData()
    })
}

async function stopTheQueue() {
    httpCookieGet('/stop', function(data) {
        fetchData()
    })
}

function searchBtnClick() {
    const searchField = document.getElementById('searchFeild').value
    if (searchField !== '') {
        search(searchField)
        document.getElementById('searchFeild').value = ''
    } else {
        console.log("empty")
    }
}

var modal = document.getElementById("myModal");
var span = document.getElementsByClassName("close")[0];

async function settingsBtnClick() {
    //ipcRenderer.send('settingsMenu')
    modal.style.display = "block";
}

// When the user clicks on <span> (x), close the modal
span.onclick = function() {
    modal.style.display = "none";
}
  
// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

document.getElementById('searchFeild').onkeypress = function(e){
    if (!e) e = window.event;
    var keyCode = e.code || e.key;
    if (keyCode == 'Enter'){
        var searchField = document.getElementById('searchFeild').value
        searchField = searchField.replaceAll(' ', '+')
        if (searchField !== '') {
            search(searchField)
            document.getElementById('searchFeild').value = ''
        } else {
            console.log("empty")
        }
        
        return false;
    }
}

String.prototype.replaceAll = function(str1, str2, ignore) 
{
    return this.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
} 

async function updatePage(recievedData) {
    buttonsControl(true)
    if (recievedData.active === false) {
        document.getElementById("statusText").innerHTML = "You are not in a voice channel or you need to reauthenticate"
        document.getElementById("preAuthBox").style.display = "flex"
        document.getElementById("postAuth").style.display = "none"
    } else {
        document.getElementById("preAuthBox").style.display = "none"
        document.getElementById("postAuth").style.display = "block"
       

        document.getElementById('username').innerText = recievedData.userInfo.username
        document.getElementById('voice').innerText = "Channel: " + recievedData.activeChannel

        //generateQueueTable(testdata)
        generateQueueTable(recievedData.queue)
        
    }
}

async function generateQueueTable(queue) {

    const queueGroup = document.getElementById('queueGroup')
    queueGroup.innerHTML = ""

    try {
        if (queue.currentsong.title) {
            console.log(queue)
        }
    } catch (error) {
        return
    }

    // setup current song display
    const currentsong = document.createElement('div') // <a>
    currentsong.classList = "list-group-item flex-column align-items-start active"
    currentsong.href = queue.currentsong.url
    //currentsong.target = "_blank"
    queueGroup.appendChild(currentsong)

    // set up current song flex box
    const currentSongflex = document.createElement('div')
    currentSongflex.classList = "d-flex justify-content-around"
    currentsong.appendChild(currentSongflex)

    // set up current thumbnail
    const currentThumbFlexItem = document.createElement('div')
    currentThumbFlexItem.classlist = "p-2"
    currentThumbFlexItem.setAttribute('width', '50%')
    const currentThumb = document.createElement('img')
    currentThumb.src = parseThumbnailUrl(queue.currentsong.thumbnail)
    currentThumb.setAttribute('width', '70%')
    currentThumbFlexItem.appendChild(currentThumb)

    // set up current text
    const currentTextFlexItem = document.createElement('div')
    currentTextFlexItem.classlist = "p-2"
    const currentTitle = document.createElement('h5')
    const currentAuthor = document.createElement('h6')
    const currentDuration = document.createElement('h6')

    currentTitle.textContent = queue.currentsong.title
    currentAuthor.textContent = queue.currentsong.author
    currentDuration.textContent = queue.currentsong.duration

    currentTitle.setAttribute('font-size', '1.5em')
    currentAuthor.setAttribute('font-size', '1.5em')
    currentDuration.setAttribute('font-size', '1.5em')

    currentTextFlexItem.appendChild(currentTitle)
    currentTextFlexItem.appendChild(currentAuthor)
    currentTextFlexItem.appendChild(currentDuration)

    // parent everything 

    currentSongflex.appendChild(currentThumbFlexItem)
    currentSongflex.appendChild(currentTextFlexItem)

    // pretty much the same code as above but for the rest of the queue
    if (queue.tracks !== []) {
        var i
        for (i=0; i < queue.tracks.length; i++) {
            // setup current song display
            const queuedSong = document.createElement('div') // <a>
            queuedSong.classList = "list-group-item flex-column align-items-start"
            queuedSong.href = queue.tracks[i].url
            //queuedSong.target = "_blank"
            queueGroup.appendChild(queuedSong)

            // set up current song flex box
            const queuedSongflex = document.createElement('div')
            queuedSongflex.classList = "d-flex justify-content-around"
            queuedSong.appendChild(queuedSongflex)

            // set up current thumbnail
            const queuedThumbFlexItem = document.createElement('div')
            queuedThumbFlexItem.classlist = "p-2"
            queuedThumbFlexItem.setAttribute('width', '50%')
            const queuedThumb = document.createElement('img')
            queuedThumb.src = parseThumbnailUrl(queue.tracks[i].thumbnail)
            queuedThumb.setAttribute('width', '70%')
            queuedThumbFlexItem.appendChild(queuedThumb)

            // set up current text
            const queuedTextFlexItem = document.createElement('div')
            queuedTextFlexItem.classlist = "p-2"
            const queuedTitle = document.createElement('h5')
            const QueuedAuthor = document.createElement('h6')
            const queuedDuration = document.createElement('h6')

            queuedTitle.textContent = queue.tracks[i].title
            QueuedAuthor.textContent = queue.tracks[i].author
            queuedDuration.textContent = queue.tracks[i].duration

            queuedTitle.setAttribute('font-size', '1.5em')
            QueuedAuthor.setAttribute('font-size', '1.5em')
            queuedDuration.setAttribute('font-size', '1.5em')

            queuedTextFlexItem.appendChild(queuedTitle)
            queuedTextFlexItem.appendChild(QueuedAuthor)
            queuedTextFlexItem.appendChild(queuedDuration)

            // parent everything 

            queuedSongflex.appendChild(queuedThumbFlexItem)
            queuedSongflex.appendChild(queuedTextFlexItem)

        }
    }
}

function parseThumbnailUrl(input) {
    try {
        const startchar = input.indexOf('/vi/') + 4
        const endchar = input.indexOf('/hqdefault.jpg')
        const otherendchar = input.indexOf('/maxresdefault.jpg')

        if ( endchar === -1 ) {
            const identifier = input.substring(startchar, otherendchar)
    
            return 'https://i.ytimg.com/vi/' + identifier + '/0.jpg'
        } else {
            const identifier = input.substring(startchar, endchar)
    
            return 'https://i.ytimg.com/vi/' + identifier + '/0.jpg'
        }
    } catch (err) {}
    
}

global.testdata = {
    currentsong: {
        author: "AJR",
        duration: "4:35",
        durationMS: 275000,
        id: "948318187856986174",
        playlist: null,
        thumbnail: "https://i3.ytimg.com/vi/CkbVu39hTT0/maxresdefault.jpg",
        title: "AJR - Ordinaryish People feat. Blue Man Group (Official Video)",
        url: "https://www.youtube.com/watch?v=CkbVu39hTT0",
        views: 490907,
    },
    tracks: [
        {
            author: "melodysheep",
            duration: "29:21",
            durationMS: 1761000,
            id: "948318205934436434",
            playlist: null,
            thumbnail: "https://i3.ytimg.com/vi/uD4izuDMUQA/maxresdefault.jpg",
            title: "TIMELAPSE OF THE FUTURE: A Journey to the End of Time (4K)",
            url: "https://www.youtube.com/watch?v=uD4izuDMUQA",
            views: 79434044,
        },
        
    ]

    

}

function buttonsControl(input) {
    const enable = !input

    const buttons = document.querySelectorAll('button')
    for (button of buttons) {
        button.disabled = enable
        if (enable) {
            button.style.color = "gray"
        } else {
            button.style.color = "#fff"
        }
        

    }

}

function logout() {
    if (confirm("Are you sure that you want to logout?")) {
        ipcRenderer.send('logout')
    }
}

function KeyPress(e) {
    //console.log(e)
    if (e.code == 'F1') {
        ipcRenderer.send('debugWin')
    }
}

document.onkeydown = KeyPress;

function randomBetween(min, max) {  
    return Math.floor(
      Math.random() * (max - min) + min
    )
}

initTitlebar()
if (isAuthenticated()) {
    initSchedule()
    fetchData()
}