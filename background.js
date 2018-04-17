const blacklist = [
  'chrome://bookmarks',
  'chrome://newtab',
];

function isBlacklisted(url) {
  return blacklist.some(i => url.startsWith(i));
}

chrome.browserAction.onClicked.addListener((tab) => {
  // don't add pinned and blacklisted tabs in the current window to bookmarks
  chrome.tabs.query({ pinned: false, currentWindow: true, }, (tabs) => {
    const filtered = tabs.filter(tab => !isBlacklisted(tab.url));

    // don't create a bookmarks folder if there's nothing to bookmark
    if (filtered.length === 0) {
      return;
    }

    // create a new folder at the top of "other bookmarks"
    chrome.bookmarks.create({ index: 0, title: new Date().toLocaleString(), }, (result) => {
      // create bookmarks in the new folder
      filtered.forEach(tab => chrome.bookmarks.create({ parentId: result.id, title: tab.title, url: tab.url, }));

      // find all bookmarks tabs
      chrome.tabs.query({ url: 'chrome://bookmarks/*', }, (tabs) => {
        // open bookmarks manager
        if (tabs.length === 0) {
          chrome.tabs.create({ url: `chrome://bookmarks/?id=${result.id}`, }, (tab) => {
            // close all tabs
            chrome.tabs.remove(filtered.map(tab => tab.id));
          });
        // focus on bookmarks manager
        } else {
          for (let i = 0; i < tabs.length; ++i) {
            if (i === 0) {
              chrome.tabs.update(tabs[i].id, { url: `chrome://bookmarks/?id=${result.id}`, active: true, }, (tab) => {
                // close all tabs
                chrome.tabs.remove(filtered.map(tab => tab.id));
              });
            } else {
              chrome.tabs.update(tabs[i].id, { url: `chrome://bookmarks/?id=${result.id}`, active: false, });              
            }
          }
        }
      });
    });
  });
});
