// Udyan Autofill Content Script
// Intelligently maps form labels and placeholders to business coordinates

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "autofill") {
    const profile = request.data;
    
    // Auto-mapping parameters
    const fieldMapping = {
      business_name: ["business_name", "firm_name", "establishment_name", "legal_name", "applicant_name", "company_name", "organization"],
      owner_name: ["owner_name", "proprietor", "authorized_signatory", "applicant", "owner", "first_name", "full_name"],
      email: ["email", "email_address", "contact_email", "mail"],
      mobile: ["mobile", "phone", "contact_number", "mobile_number", "telephone"],
      gstin: ["gstin", "gst_number", "gst_code", "tax_number"],
      fssai_number: ["fssai_number", "fssai_code", "food_license", "registration_no"],
      trade_license_number: ["trade_license", "trade_no", "license_no"],
      address: ["address", "street", "place_of_business", "premise_address", "location"],
      city: ["city", "town", "taluk", "village"],
      district: ["district", "taluka"],
      state: ["state", "province"],
      pincode: ["pincode", "pin", "postal_code", "zip"]
    };

    // Iterate through inputs
    const inputs = document.querySelectorAll("input, textarea, select");
    let filledCount = 0;

    inputs.forEach(input => {
      // Skip hidden fields
      if (input.type === "hidden" || input.style.display === "none") return;

      const name = (input.name || "").toLowerCase();
      const id = (input.id || "").toLowerCase();
      const placeholder = (input.placeholder || "").toLowerCase();
      
      // Look for labels
      let labelText = "";
      if (input.id) {
        const labelEl = document.querySelector(`label[for="${input.id}"]`);
        if (labelEl) labelText = labelEl.innerText.toLowerCase();
      }

      // Map matching keys
      for (const [coordKey, synonyms] of Object.entries(fieldMapping)) {
        const isMatch = synonyms.some(syn => 
          name.includes(syn) || 
          id.includes(syn) || 
          placeholder.includes(syn) ||
          labelText.includes(syn)
        );

        if (isMatch && profile[coordKey]) {
          input.value = profile[coordKey];
          // Dispatch input events so React/Angular/Vue values sync
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          filledCount++;
          break;
        }
      }
    });

    sendResponse({ status: "success", filled: filledCount });
  }
  return true;
});
