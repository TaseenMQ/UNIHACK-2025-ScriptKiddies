const PHISHTANK_API_KEY = "YOUR_PHISHTANK_API_KEY"; // Register and get an API key from PhishTank
const PHISHTANK_API_URL = `https://checkurl.phishtank.com/checkurl/`;

const WHOIS_API_KEY = "at_XdDtkoFfICA7wFp6KA8czJaTMGsef"; 
const GOOGLE_SAFE_BROWSING_KEY = "AIzaSyC6sHV2e2mAK1tZy4zrjPz6YK_C3-MsMrs"; 

let phishingURLs = [];

// Fetch PhishTank data correctly
async function fetchPhishTankData() {
    try {
        let response = await fetch(PHISHTANK_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `format=json&url=https://example.com&app_key=${PHISHTANK_API_KEY}`
        });

        if (!response.ok) {
            throw new Error(`PhishTank request failed: ${response.statusText}`);
        }

        let data = await response.json();
        phishingURLs = data.matches ? data.matches.map(item => item.url) : [];
        console.log("PhishTank data loaded successfully.");
    } catch (error) {
        console.error("Failed to fetch PhishTank data:", error);
    }
}

fetchPhishTankData();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "check_link") {
        let userURL = message.url;

        if (isTyposquatting(userURL)) {
            sendResponse({ warning: true, reason: "Potential typosquatting detected." });
        } else if (phishingURLs.includes(userURL)) {
            sendResponse({ warning: true, reason: "This site is flagged as phishing (PhishTank)." });
        } else {
            checkWithWhois(userURL, sendResponse);
            return true; 
        }
    }
});

function isTyposquatting(url) {
    try {
        let trustedDomains = ["google.com", "amazon.com", "facebook.com", "twitter.com", "paypal.com", "microsoft.com"];
        let urlObj = new URL(url);
        let hostname = urlObj.hostname;

        return trustedDomains.some(domain => levenshteinDistance(hostname, domain) <= 2);
    } catch (e) {
        return false;
    }
}

function levenshteinDistance(a, b) {
    let matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            let cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
        }
    }
    return matrix[a.length][b.length];
}

function checkWithWhois(url, sendResponse) {
    let urlObj = new URL(url);
    let domain = urlObj.hostname;

    fetch(`https://www.whoisxmlapi.com/whoisserver/WhoisService?apiKey=${WHOIS_API_KEY}&domainName=${domain}&outputFormat=json`)
    .then(response => response.json())
    .then(data => {
        if (data.WhoisRecord && data.WhoisRecord.createdDate) {
            let createdDate = new Date(data.WhoisRecord.createdDate);
            let ageInDays = (new Date() - createdDate) / (1000 * 60 * 60 * 24);
            if (ageInDays < 30) {
                sendResponse({ warning: true, reason: "Domain is newly registered (WhoisXML)." });
            } else {
                checkWithSafeBrowsing(url, sendResponse);
            }
        } else {
            checkWithSafeBrowsing(url, sendResponse);
        }
    })
    .catch(() => checkWithSafeBrowsing(url, sendResponse));
}

function checkWithSafeBrowsing(url, sendResponse) {
    const API_URL = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${GOOGLE_SAFE_BROWSING_KEY}`;

    let body = {
        client: { clientId: "chrome-extension", clientVersion: "3.0" },
        threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threatEntries: [{ url }]
        }
    };

    fetch(API_URL, {
        method: "POST",
        body: JSON.stringify(body),
        headers: { "Content-Type": "application/json" }
    })
    .then(response => response.json())
    .then(data => {
        sendResponse({ warning: data.matches ? true : false, reason: "Google Safe Browsing flagged this site." });
    })
    .catch(() => sendResponse({ warning: false }));
}
