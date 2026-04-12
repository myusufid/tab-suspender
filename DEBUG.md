# Debugging Tab Suspender Extension

## Quick Verification Steps

### 1. Check Extension Loaded
1. Go to `chrome://extensions/`
2. Find "Tab Suspender" in the list
3. Make sure it's **enabled** (toggle is blue)
4. Check for any error messages in red

### 2. View Background Service Worker Logs

**This is the most important debugging tool!**

1. Go to `chrome://extensions/`
2. Find "Tab Suspender"
3. Click **"service worker"** link (appears when extension is active)
4. This opens DevTools for the background script
5. Click the **Console** tab to see logs

### 3. Add Debug Logging

Add console.log statements to see what's happening:

```javascript
// In background.js, add to checkAndSuspendTabs():
async function checkAndSuspendTabs() {
  const settings = await chrome.storage.sync.get(DEFAULT_SETTINGS);

  console.log('🔍 Checking tabs...', {
    enabled: settings.enabled,
    suspendTime: settings.suspendTime,
    whitelist: settings.whitelist
  });

  if (!settings.enabled) {
    console.log('⏸️ Extension is disabled');
    return;
  }

  const tabs = await chrome.tabs.query({});
  console.log(`📋 Found ${tabs.length} tabs`);

  const now = Date.now();
  const suspendTimeMs = settings.suspendTime * 60 * 1000;

  for (const tab of tabs) {
    const lastActivity = tabActivity.get(tab.id) || now;
    const inactiveTime = now - lastActivity;
    const minutesInactive = Math.floor(inactiveTime / 1000 / 60);

    console.log(`Tab ${tab.id}: "${tab.title}"`, {
      inactive: `${minutesInactive}m`,
      shouldSuspend: inactiveTime > suspendTimeMs,
      active: tab.active,
      pinned: tab.pinned,
      url: tab.url
    });

    // ... rest of the function
  }
}
```

### 4. Test Manually

**Quick Test (3 minute setting):**

1. Open a new tab (e.g., example.com)
2. Switch to a different tab
3. Wait 3+ minutes
4. Check if the inactive tab shows the purple "Tab Suspended" page

**Verify Settings:**
1. Click the extension icon
2. Check "Enable Auto-Suspend" is ON
3. Note the "Suspend after" time (you set it to 3 minutes)
4. Click "Save Settings"

### 5. Check Alarms Are Running

In the service worker console, run:

```javascript
chrome.alarms.getAll(alarms => console.log('Active alarms:', alarms));
```

You should see:
```
Active alarms: [{name: "checkTabs", periodInMinutes: 1}]
```

### 6. Manually Trigger Check

In the service worker console, run:

```javascript
// Manually trigger tab check
chrome.alarms.onAlarm.dispatch({name: 'checkTabs'});
```

### 7. View Tab Activity Map

In the service worker console, run:

```javascript
console.log('Tab activity:', Array.from(tabActivity.entries()));
```

### 8. Check Storage

In the service worker console, run:

```javascript
chrome.storage.sync.get(null, data => console.log('Settings:', data));
```

Expected output:
```javascript
{
  suspendTime: 3,
  whitelist: [],
  enabled: true
}
```

## Common Issues

### Extension Not Suspending Tabs

**Check:**
- [ ] Extension is enabled (`chrome://extensions/`)
- [ ] "Enable Auto-Suspend" is ON in popup
- [ ] Enough time has passed (3 minutes for your setting)
- [ ] Tab is not active, pinned, or a chrome:// page
- [ ] Tab URL is not in whitelist

**Debug:**
1. Open service worker console
2. Wait for "🔍 Checking tabs..." log (appears every minute)
3. Look for the tab you're testing
4. Check the `shouldSuspend` value

### Service Worker Not Active

If you don't see "service worker" link:
1. Open any tab
2. Click the extension icon (this wakes it up)
3. Go back to `chrome://extensions/`
4. "service worker" link should appear

### No Logs Appearing

The service worker may be inactive. To keep it active:
1. Open the service worker DevTools
2. Keep the DevTools window open
3. Or trigger activity by clicking the extension icon

## Testing Checklist

- [ ] Extension installed and enabled
- [ ] Service worker console shows logs
- [ ] Alarm is created and running every minute
- [ ] Settings are saved correctly
- [ ] Tab activity is being tracked
- [ ] Inactive tab gets suspended after 3 minutes
- [ ] Clicking suspended page restores the tab
- [ ] Whitelist prevents suspension
- [ ] Pinned tabs are never suspended
- [ ] Active tab is never suspended

## Quick Debug Commands

Run these in the service worker console:

```javascript
// 1. Check settings
chrome.storage.sync.get(null, d => console.log('Settings:', d));

// 2. Check alarms
chrome.alarms.getAll(a => console.log('Alarms:', a));

// 3. Check tracked tabs
console.log('Tracked tabs:', Array.from(tabActivity.entries()));

// 4. Manually trigger check
chrome.alarms.onAlarm.dispatch({name: 'checkTabs'});

// 5. Get all tabs
chrome.tabs.query({}, tabs => console.log('All tabs:', tabs));

// 6. Force suspend a specific tab (replace TAB_ID)
chrome.tabs.get(TAB_ID, tab => {
  const url = chrome.runtime.getURL('suspended.html') +
    '?url=' + encodeURIComponent(tab.url) +
    '&title=' + encodeURIComponent(tab.title);
  chrome.tabs.update(tab.id, { url });
});
```

## Enable Full Logging Version

Replace your `background.js` with the debug version that includes extensive logging. This will show you exactly what's happening at each step.
