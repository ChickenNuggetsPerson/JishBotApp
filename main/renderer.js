document.getElementById("postAuth").style.display = "none"

console.log("Renderer Loaded")
const http = require('http');
const https = require('https')
const fs = require("fs")
const schedule = require("node-schedule")
const { ipcRenderer } = require('electron');

const notification = document.getElementById('notification');
const message = document.getElementById('message');
const restartButton = document.getElementById('restart-button');

ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    message.innerText = 'A new update is available. Downloading now...';
    notification.classList.remove('hidden');
});

ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    message.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('hidden');
    notification.classList.remove('hidden');
});

function closeNotification() {
    notification.classList.add('hidden');
}

function restartApp() {
    ipcRenderer.send('restart_app');
}

document.getElementById("authenticateBtn").onclick = async function() {
    await fetchData();
}

function initSchedule() {
    console.log('starting fetch shedule')
    global.job = schedule.scheduleJob('*/5 * * * * *', function(){
        fetchData()
    })
}

function fetchData() {
        const username = document.getElementById("name").value;
        document.getElementById("statusText").innerHTML = "Contacting Server";
        const token = "jishyBot";


        http.get('http://localhost:9999?token=' + token + "&user=" + username, (resp) => {

            let data = [];

            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data.push(Buffer.from(chunk, "utf-8").toString());
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                try {
                    const recievedData = JSON.parse(data[0]);
                    updatePage(recievedData)
                } catch (err) {
                    console.log("Incorect Token");
                }
            });

        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
}

async function updatePage(recievedData) {
    if (recievedData.active === false) {
        document.getElementById("statusText").innerHTML = "Inorect username or you are not in a voice channel";
        document.getElementById("preAuthBox").style.display = "flex"
        document.getElementById("postAuth").style.display = "none"
    } else {
        document.getElementById("preAuthBox").style.display = "none"
        document.getElementById("postAuth").style.display = "block"
        console.log(recievedData.queue)

        document.getElementById('username').innerText = recievedData.userInfo.username
        document.getElementById('voice').innerText = "Channel: " + recievedData.activeChannel

        generateQueueTable('queueTable', recievedData.queue)
        
    }
}

async function generateQueueTable(id, queue) {

    try {
        document.getElementById('currentPlaylingImg').innerHTML = ""
        document.getElementById('currentTitle').innerHTML = ""
        document.getElementById('currentAuthor').innerHTML = ""
        document.getElementById('currentDuration').innerHTML = ""

    } catch (err) {}

    const dynamicRows = document.getElementsByClassName("dynamicClass")
    console.log(dynamicRows)
    var i;
    for (i=0;i<dynamicRows.length;i++) {
        dynamicRows[i].innerHTML = ""
        dynamicRows[i].remove()    
    }

    const playingThumb = document.createElement('img')
    playingThumb.src = queue.currentsong.thumbnail
    playingThumb.setAttribute("width", "90%")
    const playingbox = document.getElementById("currentPlaylingImg")
    playingbox.appendChild(playingThumb)
    playingbox.setAttribute("float", "left")

    document.getElementById("currentTitle").innerHTML = queue.currentsong.title
    document.getElementById("currentAuthor").innerHTML = queue.currentsong.author
    document.getElementById("currentDuration").innerHTML = queue.currentsong.duration

    var i
    for (i=0; i < 1; i++) {
        const thumb = document.createElement('img')
        thumb.src = queue.tracks[i].thumbnail
        thumb.setAttribute('width', '90%')
        const imgData = document.createElement('td')
        imgData.appendChild(thumb)
        const textData = document.createElement('td')

        const title = document.createElement("h2")
        const author = document.createElement('h3')
        const duration = document.createElement('h3')

        title.innerHTML = queue.tracks[i].title
        author.innerHTML = queue.tracks[i].author
        duration.innerHTML = queue.tracks[i].duration

        title.className = "dynamictextstuff"
        author.className = "dynamictextstuff"
        duration.className = "dynamictextstuff"

        textData.appendChild(title)
        textData.appendChild(author)
        textData.appendChild(duration)

        const row = document.createElement('tr')

        row.className = "dynamicClass"

        row.appendChild(imgData)
        row.appendChild(textData)

        document.getElementById('queueBody').appendChild(row)

    }

}
const testdata = {
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
        {
            author: "melodysheep",
            duration: "29:21",
            durationMS: 1761000,
            id: "948318205934436434",
            playlist: null,
            thumbnail: "https://i3.ytimg.com/vi/uD4izuDMUQA/maxresdefault.jpg",
            title: "Other test video ",
            url: "https://www.youtube.com/watch?v=uD4izuDMUQA",
            views: 79434044,
        }
    ]

    

}

initSchedule()