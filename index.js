const { app, BrowserWindow, ipcMain } = require("electron")
const path = require('path');
const iconPath = path.join(__dirname, "build", "icon.png");

const { autoUpdater } = require('electron-updater');
let mainWindow;

const width = 900
const height = 650


const createMainWindow = () => {
    const mainWindow = new BrowserWindow ({
        width: width,
        height: height,
        minWidth: width - 1,
        minHeight: height -1 ,
        maxWidth: width + 1,
        maxHeight: height + 1,
        autoHideMenuBar: true,
        icon: iconPath,
        
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        }
    })

    mainWindow.loadFile('./main/index.html')
    mainWindow.once('ready-to-show', () => {
        autoUpdater.checkForUpdatesAndNotify();
    });
}


app.whenReady().then(() => {
    createMainWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})

autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});