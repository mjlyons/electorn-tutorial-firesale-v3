import Elements from "./elements";
import { renderMarkdown, toHTML } from "./markdown";

const checkForUnsavedChanges = async () => {
  const markdown = Elements.MarkdownView.value;
  renderMarkdown(markdown);
  const hasUnsavedChanges = await window.api.checkForUnsavedChanges(markdown);
  Elements.SaveMarkdownButton.disabled = !hasUnsavedChanges;
};

const setHasFile = async (hasFile: boolean) => {
  Elements.ShowFileButton.disabled = !hasFile;
  Elements.OpenInDefaultApplicationButton.disabled = !hasFile;
};

Elements.MarkdownView.addEventListener("input", async () => {
  checkForUnsavedChanges();
});

Elements.OpenFileButton.addEventListener("click", async () => {
  window.api.showOpenDialog();
});

window.api.onFileOpen(() => {
  checkForUnsavedChanges();
  setHasFile(true);
});

Elements.ExportHtmlButton.addEventListener("click", async () => {
  const markdown = Elements.MarkdownView.value;
  const html = await toHTML(markdown);
  window.api.exportFile(html);
});

Elements.SaveMarkdownButton.addEventListener("click", async () => {
  const markdown = Elements.MarkdownView.value;
  window.api.saveFile(markdown);
  setHasFile(true);
});
Elements.SaveMarkdownButton.disabled = false;

Elements.ShowFileButton.addEventListener("click", async () => {
  window.api.showInFolder();
});

Elements.OpenInDefaultApplicationButton.addEventListener("click", async () => {
  window.api.openInDefaultApp();
});
