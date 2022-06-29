const { app, BrowserWindow, ipcMain, shell, session } = require("electron")
const path = require('path');
const iconPath = path.join(__dirname, "build", "icon.png");
const { autoUpdater } = require('electron-updater');
const fs = require("fs");
const { hostname, port, cookieName } = require('./config.json')

app.commandLine.appendSwitch('ignore-certificate-errors')

const authUrl = 'https://' + hostname + ':' + port

process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0

const width = 900
const height = 650
const vary = 0

let mainWindow

const createMainWindow = () => {
    mainWindow = new BrowserWindow ({
        width: width,
        //height: height,
        minWidth: width - vary,
        minHeight: height - vary,
        maxWidth: width + vary,
        maxHeight: height + vary,
        autoHideMenuBar: true,
        icon: iconPath,
        frame: false,
        
        //resizable: false,
        
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            devTools: true,
            
        }
    })

    mainWindow.loadFile('./main/index.html')
}

let debugWindow

const createdebugWindow = () => {
    debugWindow = new BrowserWindow ({
        width: width,
        //height: height,
        minWidth: width - vary,
        minHeight: height - vary,
        maxWidth: width + vary,
        maxHeight: height + vary,
        autoHideMenuBar: true,
        icon: iconPath,
        frame: false,
        
        //resizable: false,
        
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false,
            devTools: true,
            
        }
    })

    debugWindow.loadFile('./debug/index.html')
}

// Create mainWindow, load the rest of the app, etc...
app.whenReady().then(() => {
    createMainWindow()

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createMainWindow()
        }
    })

    autoUpdater.setFeedURL({ provider: 'github', owner: 'ChickenNuggetsPerson', repo: 'JishBotApp'});
    autoUpdater.checkForUpdates();
}) 

ipcMain.on('app:quit', () => {
    app.quit() 
})

ipcMain.on('app:minimize', () => {
    mainWindow.minimize()
});

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

ipcMain.on('uninstall', () => {
    var child = require('child_process').execFile;
    var executablePath = "Uninstall JishBotApp.exe";

    child(executablePath, function(err, data) {
        if(err){
            console.error(err);
            return;
        }
 
        console.log(data.toString());
    });
}); 

ipcMain.on('authenticateBtn', (event, args) => {
    const authenticateWindow = new BrowserWindow({
        width: 856,
        height: 760,
        frame: false,
        webPreferences: {
            webSecurity: false,
            preload: path.join(__dirname, "main/authPreload.js")
        }
    })
    authenticateWindow.loadURL(authUrl)
    //authenticateWindow.webContents.openDevTools()
    authenticateWindow.on('page-title-updated', (event, title, explicitSet ) => {
        if (title === 'Authenticated') {
            authenticateWindow.hide()
            setTimeout(() => {
                session.defaultSession.cookies.get({ url: authUrl}).then((cookies) => {
                    var i;
                    for (i=0; i < cookies.length; i++) {
                        if (cookies[i].name === cookieName) {
                            fs.writeFileSync('./cookie.json', JSON.stringify(cookies[i]))
                            authenticateWindow.close()
                            mainWindow.webContents.send('Authenticated')
                            break
                        }
                    }
                }).catch((err) => {
                    console.log(err)
                })
            }, 300);
        }
    })
    ipcMain.on('auth:quit', () => {
        app.relaunch()
        app.exit()
    })
    
    ipcMain.on('auth:minimize', () => {
        authenticateWindow.minimize()
    });
})

ipcMain.on('logout', () => {
    
    try {
        const cookiePath =  app.getAppPath() + '\\cookie.json'
        fs.unlinkSync(cookiePath)
        app.relaunch()
        app.exit()
    } catch (error) {
        try { 
            const cookiePath =  app.getAppPath().substring(0, app.getAppPath().length - 19) + '\\cookie.json'
            fs.unlinkSync(cookiePath)
            app.relaunch()
            app.exit()

        } catch (err) {
            throw new Error(err)
        }
    }
})

ipcMain.on('debugWin', () => {
    createdebugWindow()
})
