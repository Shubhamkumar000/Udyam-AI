/**
 * FormFill AI - Background Service Worker
 * Handles tab communication and extension lifecycle.
 */

const readyTabs = new Set();

chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.type === 'CONTENT_READY' && sender.tab?.id) {
    readyTabs.add(sender.tab.id);
  }
});

// Clean up when tab closes
chrome.tabs.onRemoved.addListener(tabId => readyTabs.delete(tabId));

// Only inject content script if it wasn't auto-injected by manifest
// (e.g. for tabs that were already open before extension was installed/reloaded)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url?.startsWith('http')) {
    // Check if content script is already running by pinging it
    chrome.tabs.sendMessage(tabId, { type: 'PING' }).catch(() => {
      // Content script not ready — inject it
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['content/content.js'],
      }).catch(() => {}); // silently fail for restricted URLs
    });
  }
});
