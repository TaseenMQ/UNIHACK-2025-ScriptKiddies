document.getElementById("scanButton").addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        let url = tabs[0].url;
        chrome.runtime.sendMessage({ action: "check_link", url }, (response) => {
            document.getElementById("scanResult").innerText = response.warning 
                ? `⚠️ ${response.reason} This site may be dangerous.` 
                : "✅ This site is safe.";
        });
    });
});
