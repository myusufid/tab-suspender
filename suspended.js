// Get URL parameters
const params = new URLSearchParams(window.location.search);
const originalUrl = params.get('url');
const originalTitle = params.get('title');
const favIconUrl = params.get('favIconUrl');

// Display original tab info
if (originalTitle) {
  document.getElementById('title').textContent = originalTitle;
  document.title = originalTitle + ' (Suspended)';
}

if (originalUrl) {
  document.getElementById('url').textContent = originalUrl;
}

// Calculate and display memory savings
function updateMemoryStats() {
  // This suspended page uses minimal memory (~2-5 MB)
  const suspendedPageMemory = performance.memory ? (performance.memory.usedJSHeapSize / 1024 / 1024) : 3;

  // Average web page uses 50-200 MB, we'll estimate conservatively at 60 MB
  const estimatedOriginalMemory = 60;

  // Calculate savings percentage
  const savedMemory = estimatedOriginalMemory - suspendedPageMemory;
  const savingsPercentage = Math.round((savedMemory / estimatedOriginalMemory) * 100);

  // Update the display
  const memoryStatElement = document.querySelector('.stat:nth-child(2) .stat-value');
  if (memoryStatElement) {
    memoryStatElement.textContent = `~${savingsPercentage}% Saved`;
  }

  console.log(`Memory stats: ${suspendedPageMemory.toFixed(1)}MB used, ~${savedMemory.toFixed(1)}MB saved (${savingsPercentage}%)`);
}

// Update memory stats after page loads
setTimeout(updateMemoryStats, 1000);

// Display favicon if available
if (favIconUrl && favIconUrl !== 'undefined' && favIconUrl !== '') {
  const faviconContainer = document.getElementById('favicon-container');
  const img = document.createElement('img');
  img.src = favIconUrl;
  img.className = 'favicon';
  img.onerror = () => {
    faviconContainer.remove();
  };
  faviconContainer.appendChild(img);
}

// Restore tab when button is clicked
document.getElementById('restore').addEventListener('click', () => {
  if (originalUrl) {
    chrome.runtime.sendMessage({
      action: 'restore',
      url: originalUrl
    });
  }
});

// Also restore on any click on the page
document.addEventListener('click', (e) => {
  if (e.target.id !== 'restore' && originalUrl) {
    chrome.runtime.sendMessage({
      action: 'restore',
      url: originalUrl
    });
  }
});
