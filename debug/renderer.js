
const version = "Version: 0.3.3"

console.log(version)

const { hostname, port, cookieName } = require('../config.json')

console.log("Renderer Loaded")
const https = require('https')
const schedule = require("node-schedule")
const { ipcRenderer } = require('electron');
const ElectronTitlebarWindows = require('electron-titlebar-windows');
let $ = jQuery = require('jquery')
const fs = require('fs')

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0


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

function initSchedule() {
    console.log('starting fetch shedule')
    const cronShedule =  '*/5 * * * * *'
    console.log(cronShedule)
    global.job = schedule.scheduleJob(cronShedule, function(){
        fetchData()
    })
    
}

function isAuthenticated() {
     try {
        fs.readFileSync('./cookie.json')
        return true
    } catch (err) {
        return false
    }
}

function httpCookieGet(path, cb) {
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
            cb(JSON.parse(results))
        })
    })

    req.on('error', function (e) {
        console.log(e)
    
    })

    req.end()
}

async function fetchData() {
    httpCookieGet('/botDebug', function(data) {
        updatePage(data)
    })
    
}

async function updatePage(recievedData) {
    const debugText = document.getElementById('debug')
    debugText.innerHTML = ''

    var i;
    for (i=0; i < recievedData.length; i++) {
        var text = document.createElement('p')
        text.innerHTML = recievedData[i]

        debugText.appendChild(text)
    }
}

initTitlebar()
initSchedule()
