import { bangs } from "./bang";
import "./global.css";

const COPY_URL =
  import.meta.env.VITE_COPY_URL?.trim() || `${window.location.origin}?q=%s`;
const DEFAULT_BANG_STORAGE_KEY = "default-bang";

function getDefaultBangValue() {
  return localStorage.getItem(DEFAULT_BANG_STORAGE_KEY)?.trim().toLowerCase() || "g";
}

function getDefaultBang() {
  return bangs.find((b) => b.t === getDefaultBangValue());
}

function noSearchDefaultPageRender() {
  const app = document.querySelector<HTMLDivElement>("#app")!;
  app.innerHTML = `
    <div class="page-shell">
      <div class="content-container">
        <h1>Und*ck</h1>
        <p>DuckDuckGo's bang redirects are too slow. Add the following URL as a custom search engine to your browser. Enables <a href="https://duckduckgo.com/bang.html" target="_blank">all of DuckDuckGo's bangs.</a></p>
        <div class="url-container"> 
          <input 
            type="text" 
            class="url-input"
            value="${COPY_URL}"
            readonly 
          />
          <button class="copy-button">
            <img src="/clipboard.svg" alt="Copy" />
          </button>
        </div>
        <form class="default-bang-form">
          <label class="default-bang-label" for="default-bang-input">Default bang</label>
          <div class="default-bang-controls">
            <input
              id="default-bang-input"
              type="text"
              class="default-bang-input"
              value="${getDefaultBangValue()}"
              placeholder="g"
              autocomplete="off"
              spellcheck="false"
            />
            <button type="submit" class="save-button">Save</button>
          </div>
          <p class="default-bang-help">Used when the query does not include an explicit bang.</p>
          <p class="default-bang-status" aria-live="polite"></p>
        </form>
      </div>
      <footer class="footer">
        <a href="https://t3.chat" target="_blank">t3.chat</a>
        &bull;
        <a href="https://x.com/theo" target="_blank">theo</a>
        &bull;
        <a href="https://github.com/t3dotgg/unduck" target="_blank">github</a>
      </footer>
    </div>
  `;

  const copyButton = app.querySelector<HTMLButtonElement>(".copy-button")!;
  const copyIcon = copyButton.querySelector("img")!;
  const urlInput = app.querySelector<HTMLInputElement>(".url-input")!;
  const defaultBangForm = app.querySelector<HTMLFormElement>(".default-bang-form")!;
  const defaultBangInput = app.querySelector<HTMLInputElement>(".default-bang-input")!;
  const defaultBangStatus = app.querySelector<HTMLParagraphElement>(".default-bang-status")!;

  copyButton.addEventListener("click", async () => {
    await navigator.clipboard.writeText(urlInput.value);
    copyIcon.src = "/clipboard-check.svg";

    setTimeout(() => {
      copyIcon.src = "/clipboard.svg";
    }, 2000);
  });

  defaultBangForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const nextBang = defaultBangInput.value.replace(/^!+/, "").trim().toLowerCase();
    const bang = bangs.find((candidate) => candidate.t === nextBang);

    if (!bang) {
      defaultBangStatus.textContent = "Bang not found.";
      defaultBangStatus.dataset.state = "error";
      return;
    }

    localStorage.setItem(DEFAULT_BANG_STORAGE_KEY, bang.t);
    defaultBangInput.value = bang.t;
    defaultBangStatus.textContent = `Saved !${bang.t} as the default bang.`;
    defaultBangStatus.dataset.state = "success";
  });
}

function getBangredirectUrl() {
  const url = new URL(window.location.href);
  const query = url.searchParams.get("q")?.trim() ?? "";
  if (!query) {
    noSearchDefaultPageRender();
    return null;
  }

  const match = query.match(/!(\S+)/i);

  const bangCandidate = match?.[1]?.toLowerCase();
  const selectedBang = bangs.find((b) => b.t === bangCandidate) ?? getDefaultBang();

  // Remove the first bang from the query
  const cleanQuery = query.replace(/!\S+\s*/i, "").trim();

  // If the query is just `!gh`, use `github.com` instead of `github.com/search?q=`
  if (cleanQuery === "")
    return selectedBang ? `https://${selectedBang.d}` : null;

  // Format of the url is:
  // https://www.google.com/search?q={{{s}}}
  const searchUrl = selectedBang?.u.replace(
    "{{{s}}}",
    // Replace %2F with / to fix formats like "!ghr+t3dotgg/unduck"
    encodeURIComponent(cleanQuery).replace(/%2F/g, "/"),
  );
  if (!searchUrl) return null;

  return searchUrl;
}

function doRedirect() {
  const searchUrl = getBangredirectUrl();
  if (!searchUrl) return;
  window.location.replace(searchUrl);
}

doRedirect();
