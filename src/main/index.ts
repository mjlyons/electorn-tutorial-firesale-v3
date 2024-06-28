import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  Menu,
  MenuItemConstructorOptions,
  shell,
} from "electron";
import { readFile, writeFile } from "fs/promises";
import { basename, join } from "path";

type MarkdownFile = {
  content?: string;
  filePath?: string;
};

const currentFile: MarkdownFile = {
  content: "",
  filePath: undefined,
};

// const getCurrentFile = async (browserWindow?: BrowserWindow) => {
//   if (currentFile.filePath) return currentFile.filePath;
//   if (!browserWindow) return;
//   return showSaveDialog(browserWindow);
// };

const setCurrentFile = (browserWindow: BrowserWindow, filePath: string, content: string) => {
  currentFile.filePath = filePath;
  currentFile.content = content;

  app.addRecentDocument(filePath);
  browserWindow.setTitle(`${basename(filePath)} - ${app.getName()}`);
  browserWindow.setRepresentedFilename(filePath);
};

const hasChanges = (content: string): boolean => {
  return currentFile.content !== content;
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false,
    webPreferences: {
      preload: join(__dirname, "preload.js"),
    },
  });

  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`));
  }

  mainWindow.on("ready-to-show", (/* event */) => {
    mainWindow.show();
    mainWindow.focus();
    // showOpenDialog(mainWindow);
  });

  mainWindow.webContents.openDevTools({
    mode: "detach",
  });

  return mainWindow;
};

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

const showOpenDialog = async (browserWindow: BrowserWindow) => {
  const result = await dialog.showOpenDialog(browserWindow, {
    properties: ["openFile"],
    filters: [{ name: "Markdown File", extensions: ["md"] }],
  });

  if (result.canceled) return;

  const [filePath] = result.filePaths;
  openFile(browserWindow, filePath);
};

const openFile = async (browserWindow: BrowserWindow, filePath: string): Promise<void> => {
  const content = await readFile(filePath, { encoding: "utf-8" });
  setCurrentFile(browserWindow, filePath, content);
  browserWindow.webContents.send("file-opened", content, filePath);
};

ipcMain.on("show-open-dialog", async (event) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) return;
  showOpenDialog(browserWindow);
});

const showExportHtmlDialog = async (browserWindow: BrowserWindow): Promise<string | undefined> => {
  const { filePath } = await dialog.showSaveDialog(browserWindow, {
    title: "Export HTML",
    filters: [{ name: "HTML File", extensions: ["html"] }],
  });
  return filePath;
};

const saveFile = async (
  browserWindow: BrowserWindow,
  filePath: string,
  content: string,
): Promise<void> => {
  await writeFile(filePath, content, { encoding: "utf-8" });
  setCurrentFile(browserWindow, filePath, content);
};

ipcMain.on("export-file", async (event, htmlContent: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender) ?? undefined;
  if (!browserWindow) return;
  const filePath = await showExportHtmlDialog(browserWindow);
  if (!filePath) return;
  await writeFile(filePath, htmlContent, { encoding: "utf-8" });
});

const showSaveDialog = async (browserWindow: BrowserWindow): Promise<string | undefined> => {
  const result = await dialog.showSaveDialog(browserWindow, {
    title: "Save Markdown",
    filters: [{ name: "Markdown File", extensions: ["md"] }],
  });

  if (result.canceled) return;
  const { filePath } = result;
  if (!filePath) return;
  return filePath;
};

ipcMain.on("save-file", async (event, content: string) => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  if (!browserWindow) return;

  const filePath = currentFile.filePath ?? (await showSaveDialog(browserWindow));
  if (!filePath) return;

  await saveFile(browserWindow, filePath, content);
});

ipcMain.handle("has-changes", async (event, content: string): Promise<boolean> => {
  const browserWindow = BrowserWindow.fromWebContents(event.sender);
  const changed = hasChanges(content);
  browserWindow?.setDocumentEdited(changed);
  return changed;
});

ipcMain.on("show-in-folder", async () => {
  if (currentFile.filePath) {
    await shell.showItemInFolder(currentFile.filePath);
  }
});

ipcMain.on("open-in-default-app", async () => {
  if (currentFile.filePath) {
    await shell.openPath(currentFile.filePath);
  }
});

const template: MenuItemConstructorOptions[] = [
  {
    label: "File",
    submenu: [
      {
        label: "Open",
        click: async () => {
          let browserWindow = BrowserWindow.getFocusedWindow();
          if (!browserWindow) browserWindow = createWindow();
          showOpenDialog(browserWindow);
        },
        accelerator: "CmdOrCtrl+O",
      },
      { role: "close" },
    ],
  },
  {
    role: "editMenu",
  },
  {
    role: "windowMenu",
  },
];
if (process.platform === "darwin") {
  template.unshift({ role: "appMenu" });
}
const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
