import { contextBridge, ipcRenderer } from "electron";
import Elements from "./renderer/elements";
import { renderMarkdown } from "./renderer/markdown";

ipcRenderer.on("file-opened", async (_event, content: string) => {
  Elements.MarkdownView.value = content;
  renderMarkdown(content);
});

contextBridge.exposeInMainWorld("api", {
  onFileOpen: (callback: (content: string) => void) => {
    ipcRenderer.on("file-opened", (_event, content: string) => {
      callback(content);
    });
  },
  showOpenDialog: async () => {
    ipcRenderer.send("show-open-dialog");
  },
  exportFile: async (htmlContent: string) => {
    ipcRenderer.send("export-file", htmlContent);
  },
  saveFile: async (content: string) => {
    ipcRenderer.send("save-file", content);
  },
  checkForUnsavedChanges: async (content: string) => {
    const result = await ipcRenderer.invoke("has-changes", content);
    console.log({ result });
    return result;
  },
  showInFolder: async () => {
    ipcRenderer.send("show-in-folder");
  },
  openInDefaultApp: async () => {
    ipcRenderer.send("open-in-default-app");
  },
});
