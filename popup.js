// Load saved settings
document.addEventListener('DOMContentLoaded', () => {
  chrome.storage.sync.get({
    suspendTime: 10,
    whitelist: [],
    enabled: true
  }, (settings) => {
    document.getElementById('suspendTime').value = settings.suspendTime;
    document.getElementById('whitelist').value = settings.whitelist.join('\n');
    document.getElementById('enabled').checked = settings.enabled;
  });
});

// Save settings
document.getElementById('save').addEventListener('click', () => {
  const suspendTime = parseInt(document.getElementById('suspendTime').value);
  const whitelistText = document.getElementById('whitelist').value;
  const whitelist = whitelistText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  const enabled = document.getElementById('enabled').checked;

  chrome.storage.sync.set({
    suspendTime,
    whitelist,
    enabled
  }, () => {
    // Show success message
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    status.className = 'status success';

    setTimeout(() => {
      status.style.display = 'none';
    }, 2000);
  });
});
