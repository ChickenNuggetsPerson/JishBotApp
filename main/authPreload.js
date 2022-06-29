const ElectronTitlebarWindows = require('electron-titlebar-windows');
const { ipcRenderer } = require('electron')

window.addEventListener('DOMContentLoaded', () => {
    console.log("Init Titlebar")
    const titlebar = new ElectronTitlebarWindows({
        draggable: true
    })
    const titleDiv = document.createElement('div')
    document.body.insertBefore(titleDiv, document.body.firstChild)
    titlebar.appendTo(titleDiv)
    titlebar.on('close', () => {
        ipcRenderer.send('auth:quit')
    })
    //titlebar.on('minimize', () => {
    //    ipcRenderer.send('auth:minimize')
    //})
})