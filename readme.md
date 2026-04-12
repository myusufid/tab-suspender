# Tab Suspender

A Chrome extension that automatically suspends inactive tabs to save memory and improve browser performance.

## Features

- **Automatic Tab Suspension**: Suspends tabs after a specified period of inactivity
- **Customizable Timer**: Set how long before tabs are suspended (default: 30 minutes)
- **URL Whitelist**: Prevent specific websites from being suspended
- **One-Click Restore**: Click anywhere on a suspended tab to restore it
- **Memory Efficient**: Suspended tabs use minimal memory
- **Smart Detection**: Never suspends:
  - Active tabs
  - Pinned tabs
  - Chrome system pages
  - Whitelisted URLs

## Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked"
5. Select the `tab-suspender` folder

## Usage

### Basic Usage

1. Install the extension
2. Click the extension icon to open settings
3. Configure your preferences:
   - **Enable/Disable**: Toggle auto-suspension on/off
   - **Suspend Time**: Set minutes of inactivity before suspension
   - **Whitelist**: Add URLs that should never be suspended

### Whitelist Patterns

Add one URL pattern per line in the whitelist. Examples:

```
example.com
*.google.com
localhost:*
github.com/username/*
```

### Restoring Tabs

When a tab is suspended, you'll see a purple page with the original title and URL. To restore:
- Click the "Restore Tab" button, or
- Click anywhere on the page

## How It Works

1. The extension tracks when you last interacted with each tab
2. Every minute, it checks all tabs for inactivity
3. Tabs inactive longer than your set time are suspended
4. Suspended tabs are replaced with a lightweight placeholder page
5. Original tab data (URL, title, favicon) is preserved
6. Click to instantly restore the original page

## Settings

- **Suspend Time**: 1-1440 minutes (default: 30)
- **Whitelist**: Unlimited URL patterns
- **Enable/Disable**: Quick toggle for the entire extension

## Privacy

This extension:
- ✅ Stores settings locally in Chrome
- ✅ Only accesses tab information
- ✅ Does NOT send any data to external servers
- ✅ Does NOT track your browsing history
- ✅ Works completely offline

## Development

### File Structure

```
tab-suspender/
├── manifest.json          # Extension configuration
├── background.js          # Service worker for tab management
├── popup.html            # Settings popup UI
├── popup.js              # Settings popup logic
├── suspended.html        # Suspended tab page
├── suspended.js          # Suspended tab logic
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   ├── icon128.png
│   └── create-icons.html # Icon generator
└── readme.md            # This file
```

### Technologies Used

- Chrome Extension Manifest V3
- Vanilla JavaScript (no dependencies)
- Chrome Storage API
- Chrome Tabs API
- Chrome Alarms API

## Troubleshooting

**Tabs aren't being suspended:**
- Check if the extension is enabled in settings
- Verify the tab isn't pinned or active
- Check if the URL is in your whitelist
- Make sure enough time has passed (check your suspend time setting)

**Settings aren't saving:**
- Check Chrome's storage permissions
- Try disabling and re-enabling the extension

**Icons not showing:**
- Make sure all three icon files are in the `icons/` folder

## License

Free to use and modify.

## Contributing

Feel free to submit issues or pull requests for improvements!
