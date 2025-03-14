// content.js
const suspiciousDomains = ["scam-example.com", "fake-login.com", "phish-site.org"];

document.addEventListener("click", (event) => {
  const link = event.target.closest("a");
  if (link) {
    const url = new URL(link.href);
    if (suspiciousDomains.includes(url.hostname)) {
      event.preventDefault();
      showPopup(link.href);
    }
  }
});

function showPopup(scamUrl) {
  const popup = document.createElement("div");
  popup.className = "scam-popup";
  popup.innerHTML = `
    <div class="popup-content">
      <h2>⚠️ Scam Link Detected!</h2>
      <p>The link you clicked on might be unsafe:</p>
      <code>${scamUrl}</code>
      <button id="close-popup">Close</button>
    </div>
  `;
  document.body.appendChild(popup);

  document.getElementById("close-popup").addEventListener("click", () => {
    popup.remove();
  });
}

// Add some styling
const style = document.createElement("style");
style.textContent = `
  .scam-popup {
    position: fixed;
    top: 20%;
    left: 50%;
    transform: translate(-50%, -50%);
    background-color: white;
    padding: 20px;
    border: 2px solid red;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    border-radius: 8px;
  }
  .popup-content h2 {
    color: red;
  }
  .popup-content button {
    background-color: red;
    color: white;
    border: none;
    padding: 10px 20px;
    cursor: pointer;
    border-radius: 5px;
  }
  .popup-content button:hover {
    background-color: darkred;
  }
`;
document.head.appendChild(style);
