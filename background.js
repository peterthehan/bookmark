const blacklist = [
  'chrome://bookmarks',
  'chrome://newtab',
];

function isBlacklisted(url) {
  return blacklist.some(i => url.startsWith(i));
}

function removeTabs(tabs) {
  chrome.tabs.remove(tabs.map(tab => tab.id));
}

function createProperties(resultId, active) {
  return {
    url: `chrome://bookmarks/?id=${resultId}`,
    active,
  };
}

function goToBookmarksManager(tabs, filtered, result) {
  if (tabs.length === 0) {
    chrome.tabs.create(createProperties(result.id, true), (_) => removeTabs(filtered));
    return;
  }

  const [firstTab, ...restTabs] = tabs;
  chrome.tabs.update(firstTab.id, createProperties(result.id, true), (_) => removeTabs(filtered));

  const notActive = createProperties(result.id, false);
  restTabs.map(tab => chrome.tabs.update(tab.id, notActive));
}

chrome.browserAction.onClicked.addListener((_) => {
  chrome.tabs.query({ pinned: false, currentWindow: true, }, (tabs) => {
    const filtered = tabs.filter(tab => !isBlacklisted(tab.url));

    if (filtered.length === 0) {
      return;
    }

    chrome.bookmarks.create({ index: 0, title: new Date().toLocaleString(), }, (result) => {
      filtered.forEach(tab => chrome.bookmarks.create({ parentId: result.id, title: tab.title, url: tab.url, }));
      chrome.tabs.query({ url: 'chrome://bookmarks/*', }, tabs => goToBookmarksManager(tabs, filtered, result));
    });
  });
});
