document.addEventListener("click", (event) => {
    let target = event.target.closest("a");

    if (target && target.href) {
        chrome.runtime.sendMessage({ action: "check_link", url: target.href }, (response) => {
            if (response.warning) {
                event.preventDefault();
                if (confirm(`⚠️ ${response.reason} Do you still wish to continue?`)) {
                    window.location.href = target.href;
                }
            }
        });
    }
});
