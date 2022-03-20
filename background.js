const CHROME_SCHEME = "chrome";

function toPromise(api) {
  return (...args) => {
    return new Promise((resolve) => {
      api(...args, resolve);
    });
  };
}

const queryTabs = toPromise(chrome.tabs.query);
const createBookmarks = toPromise(chrome.bookmarks.create);
const createTabs = toPromise(chrome.tabs.create);
const removeTabs = toPromise(chrome.tabs.remove);

async function queryValidTabs() {
  const tabs = await queryTabs({ pinned: false, currentWindow: true });
  return tabs.filter((tab) => !tab.url.startsWith(CHROME_SCHEME));
}

async function createBookmarkTree(tabs) {
  const parent = await createBookmarks({
    index: 0,
    title: new Date().toLocaleString(),
  });

  tabs.forEach((tab) =>
    createBookmarks({ parentId: parent.id, title: tab.title, url: tab.url })
  );

  return parent;
}

chrome.action.onClicked.addListener(async () => {
  const tabs = await queryValidTabs();

  if (tabs.length === 0) {
    return;
  }

  const parent = await createBookmarkTree(tabs);

  await createTabs({
    url: `${CHROME_SCHEME}://bookmarks/?id=${parent.id}`,
    active: true,
  });

  removeTabs(tabs.map((tab) => tab.id));
});
