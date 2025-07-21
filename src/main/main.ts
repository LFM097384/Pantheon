import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { isDev } from './utils'

class MainWindow {
  private window: BrowserWindow | null = null

  constructor() {
    this.createWindow()
    this.registerEvents()
  }

  private createWindow(): void {
    // 创建浏览器窗口
    this.window = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 700,
      show: false,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, 'preload.js')
      }
    })

    // 加载应用
    if (isDev()) {
      this.window.loadURL('http://localhost:3000')
      this.window.webContents.openDevTools()
    } else {
      this.window.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // 窗口准备好后显示
    this.window.once('ready-to-show', () => {
      this.window?.show()
    })

    // 窗口关闭事件
    this.window.on('closed', () => {
      this.window = null
    })
  }

  private registerEvents(): void {
    // IPC 事件处理
    ipcMain.handle('app:getVersion', () => {
      return app.getVersion()
    })

    ipcMain.handle('app:getPath', (_, name: string) => {
      return app.getPath(name as any)
    })
  }

  public getWindow(): BrowserWindow | null {
    return this.window
  }
}

class Application {
  private _mainWindow: MainWindow | null = null

  constructor() {
    this.registerAppEvents()
  }

  get mainWindow(): MainWindow | null {
    return this._mainWindow
  }

  private registerAppEvents(): void {
    // 当 Electron 完成初始化并准备创建浏览器窗口时调用
    app.whenReady().then(() => {
      this._mainWindow = new MainWindow()

      app.on('activate', () => {
        // 在 macOS 上，当点击 dock 图标并且没有其他窗口打开时，
        // 通常会重新创建一个窗口
        if (BrowserWindow.getAllWindows().length === 0) {
          this._mainWindow = new MainWindow()
        }
      })
    })

    // 当所有窗口关闭时退出应用
    app.on('window-all-closed', () => {
      // 在 macOS 上，应用通常会保持活动状态，即使没有窗口打开
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })
  }
}

// 创建应用实例
new Application()
