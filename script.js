let currentCaptcha = "";

const openEnquiryBtn = document.getElementById("openEnquiry");
const openEnquirySideBtn = document.getElementById("openEnquirySide");
const enquiryModal = document.getElementById("enquiryModal");
const closeEnquiryBtn = document.getElementById("closeEnquiry");
const modalOverlay = document.getElementById("modalOverlay");
const captchaCode = document.getElementById("captchaCode");
const refreshCaptcha = document.getElementById("refreshCaptcha");
const captchaInput = document.getElementById("captchaInput");
const enquiryForm = document.getElementById("enquiryForm");
const errorMsg = document.querySelector(".error-msg");
const successMsg = document.querySelector(".success-msg");
const projectSelect = document.getElementById("projectSelect");
const nameInput = document.getElementById("name");

function getPhoneE164India(mobile) {
  const digitsOnly = String(mobile || "").replace(/\D/g, "");
  const lastTenDigits = digitsOnly.slice(-10);
  if (!/^\d{10}$/.test(lastTenDigits)) {
    return "";
  }
  return `+91${lastTenDigits}`;
}

function getPhoneDigitsIndiaNumber(mobile) {
  const digitsOnly = String(mobile || "").replace(/\D/g, "");
  const lastTenDigits = digitsOnly.slice(-10);
  if (!/^\d{10}$/.test(lastTenDigits)) {
    return null;
  }
  return Number(lastTenDigits);
}

function trackWebEngageEvent(eventName, attributes) {
  if (typeof window.webengage === "undefined" || typeof window.webengage.track !== "function") {
    return;
  }
  window.webengage.track(eventName, attributes || {});
}

function identifyWebEngageUser(formData) {
  if (typeof window.webengage === "undefined" || !window.webengage.user) {
    return;
  }

  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const mobile = String(formData.get("mobile") || "").trim();
  const phoneE164 = getPhoneE164India(mobile);

  if (!phoneE164) {
    return;
  }

  if (typeof window.webengage.user.login === "function") {
    window.webengage.user.login(phoneE164);
  }
  if (typeof window.webengage.user.setAttribute === "function") {
    window.webengage.user.setAttribute("we_phone", phoneE164);
    if (email) {
      window.webengage.user.setAttribute("we_email", email);
    }
    if (name) {
      window.webengage.user.setAttribute("we_first_name", name);
    }
  }
}

function buildEnquiryPayload(formData, sourceLabel) {
  const projectName = String(formData.get("project") || projectSelect.value || "").trim();
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const mobile = String(formData.get("mobile") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const phoneNumber = getPhoneDigitsIndiaNumber(mobile);

  return {
    Source: sourceLabel,
    "Project Name": projectName,
    Name: name,
    Email: email,
    "Phone Number": phoneNumber,
    Message: message,
    "Preferred mode of contact": "Call/SMS/WhatsApp/Email",
  };
}

function generateCaptcha() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function renderCaptcha(code) {
  captchaCode.textContent = code.split("").join(" ");
}

function setCaptcha() {
  currentCaptcha = generateCaptcha();
  renderCaptcha(currentCaptcha);
}

function clearMessages() {
  errorMsg.textContent = "";
  successMsg.textContent = "";
}

function openModal(sourceLabel) {
  enquiryModal.hidden = false;
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  clearMessages();
  captchaInput.value = "";
  setCaptcha();
  setTimeout(() => {
    document.getElementById("projectSelect").focus();
  }, 0);
}

function closeModal() {
  enquiryModal.hidden = true;
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  clearMessages();
}

function validateForm() {
  const formData = new FormData(enquiryForm);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const mobile = String(formData.get("mobile") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const consent = formData.get("consent");
  const captchaValue = String(formData.get("captchaInput") || "").trim();

  if (!name || !email || !mobile || !message) {
    return { valid: false, message: "Please fill all required fields." };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: "Please enter a valid email address." };
  }

  if (!/^\d{10}$/.test(mobile)) {
    return { valid: false, message: "Please enter a valid 10-digit mobile number." };
  }

  if (!consent) {
    return { valid: false, message: "Please provide consent to continue." };
  }

  if (!captchaValue) {
    return { valid: false, message: "Please enter the captcha code." };
  }

  if (captchaValue !== currentCaptcha) {
    return { valid: false, message: "Captcha does not match. Please try again." };
  }

  return { valid: true };
}

openEnquiryBtn.addEventListener("click", () => {
  const sourceLabel = "Bottom Enquiry CTA";
  const payload = buildEnquiryPayload(new FormData(enquiryForm), sourceLabel);
  trackWebEngageEvent("Enquire Now Clicked", {
    Source: payload.Source,
    "Project Name": payload["Project Name"],
  });
  formStartedTracked = false;
  currentEnquirySource = sourceLabel;
  openModal("Bottom Enquiry CTA");
});

openEnquirySideBtn.addEventListener("click", () => {
  const sourceLabel = "Side Enquire CTA";
  const payload = buildEnquiryPayload(new FormData(enquiryForm), sourceLabel);
  trackWebEngageEvent("Enquire Now Clicked", {
    Source: payload.Source,
    "Project Name": payload["Project Name"],
  });
  formStartedTracked = false;
  currentEnquirySource = sourceLabel;
  openModal("Side Enquire CTA");
});
closeEnquiryBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
refreshCaptcha.addEventListener("click", () => {
  captchaInput.value = "";
  setCaptcha();
  clearMessages();
});

let currentEnquirySource = "Bottom Enquiry CTA";
let formStartedTracked = false;

nameInput.addEventListener("input", () => {
  if (formStartedTracked || !nameInput.value.trim()) {
    return;
  }
  const payload = buildEnquiryPayload(new FormData(enquiryForm), currentEnquirySource);
  trackWebEngageEvent("Enquire Now Form Started", {
    Source: payload.Source,
    "Project Name": payload["Project Name"],
  });
  formStartedTracked = true;
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !enquiryModal.hidden) {
    closeModal();
  }
});

enquiryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  clearMessages();

  const result = validateForm();
  if (!result.valid) {
    errorMsg.textContent = result.message || "Unable to submit form.";
    return;
  }

  const formData = new FormData(enquiryForm);
  identifyWebEngageUser(formData);
  const payload = buildEnquiryPayload(formData, currentEnquirySource);
  trackWebEngageEvent("Enquire Now Form Filled", payload);

  successMsg.textContent = "Thank you. Your enquiry has been submitted successfully.";
  enquiryForm.reset();
  captchaInput.value = "";
  setCaptcha();
});

setCaptcha();
