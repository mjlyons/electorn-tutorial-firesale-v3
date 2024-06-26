import Elements from "./elements";
import { renderMarkdown, toHTML } from "./markdown";

const checkForUnsavedChanges = async () => {
  const markdown = Elements.MarkdownView.value;
  renderMarkdown(markdown);
  const hasUnsavedChanges = await window.api.checkForUnsavedChanges(markdown);
  Elements.SaveMarkdownButton.disabled = !hasUnsavedChanges;
};

Elements.MarkdownView.addEventListener("input", async () => {
  checkForUnsavedChanges();
});

Elements.OpenFileButton.addEventListener("click", async () => {
  window.api.showOpenDialog();
});

window.api.onFileOpen(() => {
  checkForUnsavedChanges();
});

Elements.ExportHtmlButton.addEventListener("click", async () => {
  const markdown = Elements.MarkdownView.value;
  const html = await toHTML(markdown);
  window.api.exportFile(html);
});

Elements.SaveMarkdownButton.addEventListener("click", async () => {
  const markdown = Elements.MarkdownView.value;
  window.api.saveFile(markdown);
});
Elements.SaveMarkdownButton.disabled = false;
