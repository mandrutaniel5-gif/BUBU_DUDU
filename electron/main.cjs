// Aplicatia de Windows (Electron): deschide jocul construit (dist/) intr-o fereastra.
const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

// placa video: unele laptopuri (drivere Intel mai vechi) sunt pe "lista neagra" a Chromium si atunci jocul
// se deseneaza doar cu procesorul (foarte incet). Folosim placa video oricum, cu desenul accelerat.
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-accelerated-2d-canvas');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 500,
    title: 'Bubu & Dudu', backgroundColor: '#ffeacc', autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'dist', 'icon-512.png'),
    webPreferences: { contextIsolation: true, sandbox: true, backgroundThrottling: true },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  // linkurile externe se deschid in browser
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('before-input-event', (_e, input) => { if (input.key === 'F11' && input.type === 'keyDown') win.setFullScreen(!win.isFullScreen()); });
}
app.whenReady().then(createWindow);
app.on('window-all-closed', () => app.quit());
