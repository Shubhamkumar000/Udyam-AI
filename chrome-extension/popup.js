// Udyan Extension Popup scripting
document.addEventListener("DOMContentLoaded", () => {
  const profileNameEl = document.getElementById("profile-name");
  const autofillBtn = document.getElementById("autofill-btn");
  const statusText = document.getElementById("status-text");

  // Load profile from localhost API (or default to Spice Route Restaurant)
  const defaultProfile = {
    business_name: "Spice Route Restaurant",
    owner_name: "Rahul Sharma",
    mobile: "9876543210",
    email: "rahul@spiceroute.in",
    gstin: "29ABCDE1234F1Z5",
    fssai_number: "21224009000123",
    address: "MG Road, Bengaluru",
    city: "Bengaluru",
    state: "Karnataka",
    pincode: "560001"
  };

  // Check Udyan API for active profile
  fetch("http://localhost:5000/api/business-profile")
    .then(res => res.json())
    .then(data => {
      profileNameEl.innerText = data.business_name || defaultProfile.business_name;
      bindAutofill(data);
    })
    .catch(() => {
      // Offline fallback
      profileNameEl.innerText = defaultProfile.business_name;
      bindAutofill(defaultProfile);
    });

  function bindAutofill(profile) {
    autofillBtn.addEventListener("click", () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (!tabs[0]) return;
        chrome.tabs.sendMessage(
          tabs[0].id,
          { action: "autofill", data: profile },
          (response) => {
            if (response && response.status === "success") {
              statusText.style.display = "block";
              statusText.innerText = `✓ Autofilled ${response.filled} fields`;
              setTimeout(() => {
                statusText.style.display = "none";
              }, 3000);
            }
          }
        );
      });
    });
  }
});
