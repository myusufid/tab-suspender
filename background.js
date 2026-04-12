// Default settings
const DEFAULT_SETTINGS = {
  suspendTime: 10, // minutes
  whitelist: [],
  enabled: true
};

// Store tab activity timestamps
const tabActivity = new Map();

// Debug mode - set to false to disable logging
const DEBUG = true;

function log(...args) {
  if (DEBUG) {
    console.log('[Tab Suspender]', ...args);
  }
}

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  log('🚀 Extension installed/updated', details.reason);

  chrome.storage.sync.get(DEFAULT_SETTINGS, (settings) => {
    chrome.storage.sync.set(settings);
    log('⚙️ Settings initialized:', settings);
  });

  // Create alarm to check tabs periodically
  chrome.alarms.create('checkTabs', { periodInMinutes: 1 });
  log('⏰ Alarm created: checking tabs every 1 minute');

  // On update, restore suspended tabs
  if (details.reason === 'update') {
    log('🔄 Extension updated, checking for suspended tabs to restore...');
    await restoreSuspendedTabsAfterUpdate();
  }
});

// Restore suspended tabs after extension update
async function restoreSuspendedTabsAfterUpdate() {
  try {
    const tabs = await chrome.tabs.query({});

    for (const tab of tabs) {
      // Check if tab is a suspended page from this extension
      if (tab.url && tab.url.startsWith('chrome-extension://')) {
        // Try to get the original URL from the tab's URL parameters
        try {
          const url = new URL(tab.url);
          const originalUrl = url.searchParams.get('url');
          const originalTitle = url.searchParams.get('title');

          if (originalUrl) {
            log(`🔧 Fixing suspended tab ${tab.id}: "${originalTitle || originalUrl}"`);

            // Re-suspend with new extension URL
            const newSuspendedUrl = chrome.runtime.getURL('suspended.html') +
              '?url=' + encodeURIComponent(originalUrl) +
              '&title=' + encodeURIComponent(originalTitle || '') +
              '&favIconUrl=' + encodeURIComponent(url.searchParams.get('favIconUrl') || '');

            await chrome.tabs.update(tab.id, { url: newSuspendedUrl });
          }
        } catch (e) {
          log(`⚠️ Could not parse suspended tab ${tab.id}:`, e.message);
        }
      }
    }
    log('✅ Suspended tabs restoration complete');
  } catch (error) {
    log('❌ Error restoring suspended tabs:', error);
  }
}

// Wake up on browser startup
chrome.runtime.onStartup.addListener(() => {
  log('🌅 Browser started');
});

// Track tab activation
chrome.tabs.onActivated.addListener((activeInfo) => {
  tabActivity.set(activeInfo.tabId, Date.now());
  log('👆 Tab activated:', activeInfo.tabId);
});

// Track tab updates (page loads, etc)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    tabActivity.set(tabId, Date.now());
    log('🔄 Tab updated:', tabId, tab.title);
  }
});

// Clean up closed tabs
chrome.tabs.onRemoved.addListener((tabId) => {
  tabActivity.delete(tabId);
  log('🗑️ Tab removed:', tabId);
});

// Check tabs periodically
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'checkTabs') {
    checkAndSuspendTabs();
  }
});

async function checkAndSuspendTabs() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  log('🔍 Checking tabs...', {
    enabled: settings.enabled,
    suspendTime: `${settings.suspendTime} minutes`,
    whitelist: settings.whitelist
  });

  if (!settings.enabled) {
    log('⏸️ Extension is disabled, skipping check');
    return;
  }

  const tabs = await chrome.tabs.query({});
  const now = Date.now();
  const suspendTimeMs = settings.suspendTime * 60 * 1000;

  log(`📋 Found ${tabs.length} total tabs`);

  let suspended = 0;
  let skipped = 0;

  for (const tab of tabs) {
    const lastActivity = tabActivity.get(tab.id) || now;
    const inactiveTime = now - lastActivity;
    const minutesInactive = Math.floor(inactiveTime / 1000 / 60);

    // Skip if tab is already suspended
    if (tab.url && tab.url.startsWith('chrome-extension://')) {
      log(`⏭️ Tab ${tab.id}: Already suspended`);
      skipped++;
      continue;
    }

    // Skip active tab
    if (tab.active) {
      log(`⏭️ Tab ${tab.id}: Active tab, skipping`);
      skipped++;
      continue;
    }

    // Skip pinned tabs
    if (tab.pinned) {
      log(`⏭️ Tab ${tab.id}: Pinned tab, skipping`);
      skipped++;
      continue;
    }

    // Skip special Chrome pages
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://'))) {
      log(`⏭️ Tab ${tab.id}: Chrome system page, skipping`);
      skipped++;
      continue;
    }

    // Skip whitelisted URLs
    if (isWhitelisted(tab.url, settings.whitelist)) {
      log(`⏭️ Tab ${tab.id}: Whitelisted URL, skipping - ${tab.url}`);
      skipped++;
      continue;
    }

    // Check if tab should be suspended
    const shouldSuspend = inactiveTime > suspendTimeMs;

    log(`📊 Tab ${tab.id}: "${tab.title}"`, {
      url: tab.url,
      inactive: `${minutesInactive}m ${Math.floor((inactiveTime % 60000) / 1000)}s`,
      threshold: `${settings.suspendTime}m`,
      shouldSuspend
    });

    if (shouldSuspend) {
      log(`💤 SUSPENDING Tab ${tab.id}: "${tab.title}"`);
      suspendTab(tab);
      suspended++;
    }
  }

  log(`✅ Check complete: ${suspended} suspended, ${skipped} skipped`);
}

function isWhitelisted(url, whitelist) {
  if (!url || !whitelist || whitelist.length === 0) {
    return false;
  }

  return whitelist.some(pattern => {
    try {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(url);
    } catch (e) {
      return url.includes(pattern);
    }
  });
}

function suspendTab(tab) {
  // Store tab info before suspending
  const suspendedUrl = chrome.runtime.getURL('suspended.html') +
    '?url=' + encodeURIComponent(tab.url) +
    '&title=' + encodeURIComponent(tab.title) +
    '&favIconUrl=' + encodeURIComponent(tab.favIconUrl || '');

  log(`🎯 Suspending tab ${tab.id} to: ${suspendedUrl}`);

  chrome.tabs.update(tab.id, { url: suspendedUrl });
  tabActivity.delete(tab.id);
}

// Listen for messages from suspended pages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'restore') {
    log(`🔄 Restoring tab ${sender.tab.id} to: ${message.url}`);
    chrome.tabs.update(sender.tab.id, { url: message.url });
  }
});
