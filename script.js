let modalCaptcha = "";
let mainCaptcha = "";

const openEnquiryBtn = document.getElementById("openEnquiry");
const openEnquirySideBtn = document.getElementById("openEnquirySide");
const enquiryModal = document.getElementById("enquiryModal");
const closeEnquiryBtn = document.getElementById("closeEnquiry");
const modalOverlay = document.getElementById("modalOverlay");

const enquiryForm = document.getElementById("enquiryForm");
const projectSelect = document.getElementById("projectSelect");
const nameInput = document.getElementById("name");
const captchaCode = document.getElementById("captchaCode");
const refreshCaptcha = document.getElementById("refreshCaptcha");
const captchaInput = document.getElementById("captchaInput");
const modalErrorMsg = enquiryModal.querySelector(".error-msg");
const modalSuccessMsg = enquiryModal.querySelector(".success-msg");

const mainEnquiryForm = document.getElementById("mainEnquiryForm");
const mainProjectSelect = document.getElementById("mainProjectSelect");
const mainNameInput = document.getElementById("mainName");
const mainCaptchaCode = document.getElementById("mainCaptchaCode");
const mainRefreshCaptcha = document.getElementById("mainRefreshCaptcha");
const mainCaptchaInput = document.getElementById("mainCaptchaInput");
const mainErrorMsg = document.getElementById("mainErrorMsg");
const mainSuccessMsg = document.getElementById("mainSuccessMsg");

let currentEnquirySource = "Bottom Enquiry CTA";
let formStartedTracked = false;
let mainFormStartedTracked = false;

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

function submitSuccessFlow(formData, sourceLabel, fallbackProjectName) {
  identifyWebEngageUser(formData);
  const payload = buildEnquiryPayload(formData, sourceLabel, fallbackProjectName);
  trackWebEngageEvent("Enquire Now Form Filled", payload);
  setTimeout(() => {
    window.location.href = "thank-you.html";
  }, 150);
}

function buildEnquiryPayload(formData, sourceLabel, fallbackProjectName) {
  const projectName = String(formData.get("project") || fallbackProjectName || "").trim();
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

function renderCaptcha(targetEl, code) {
  if (!targetEl) {
    return;
  }
  targetEl.textContent = code.split("").join(" ");
}

function setModalCaptcha() {
  modalCaptcha = generateCaptcha();
  renderCaptcha(captchaCode, modalCaptcha);
}

function setMainCaptcha() {
  mainCaptcha = generateCaptcha();
  renderCaptcha(mainCaptchaCode, mainCaptcha);
}

function clearMessages(errorEl, successEl) {
  if (errorEl) {
    errorEl.textContent = "";
  }
  if (successEl) {
    successEl.textContent = "";
  }
}

function openModal() {
  enquiryModal.hidden = false;
  modalOverlay.hidden = false;
  document.body.style.overflow = "hidden";
  clearMessages(modalErrorMsg, modalSuccessMsg);
  captchaInput.value = "";
  setModalCaptcha();
  setTimeout(() => {
    projectSelect.focus();
  }, 0);
}

function closeModal() {
  enquiryModal.hidden = true;
  modalOverlay.hidden = true;
  document.body.style.overflow = "";
  clearMessages(modalErrorMsg, modalSuccessMsg);
}

function validateForm(form, expectedCaptcha, captchaFieldName) {
  const formData = new FormData(form);
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "").trim();
  const mobile = String(formData.get("mobile") || "").trim();
  const message = String(formData.get("message") || "").trim();
  const consent = formData.get("consent");
  const captchaValue = String(formData.get(captchaFieldName) || "").trim();

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

  if (captchaValue !== expectedCaptcha) {
    return { valid: false, message: "Captcha does not match. Please try again." };
  }

  return { valid: true };
}

openEnquiryBtn.addEventListener("click", () => {
  const sourceLabel = "Bottom Enquiry CTA";
  const payload = buildEnquiryPayload(new FormData(enquiryForm), sourceLabel, projectSelect.value);
  trackWebEngageEvent("Enquire Now Clicked", {
    Source: payload.Source,
    "Project Name": payload["Project Name"],
  });
  formStartedTracked = false;
  currentEnquirySource = sourceLabel;
  openModal();
});

openEnquirySideBtn.addEventListener("click", () => {
  const sourceLabel = "Side Enquire CTA";
  const payload = buildEnquiryPayload(new FormData(enquiryForm), sourceLabel, projectSelect.value);
  trackWebEngageEvent("Enquire Now Clicked", {
    Source: payload.Source,
    "Project Name": payload["Project Name"],
  });
  formStartedTracked = false;
  currentEnquirySource = sourceLabel;
  openModal();
});

closeEnquiryBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", closeModal);
refreshCaptcha.addEventListener("click", () => {
  captchaInput.value = "";
  setModalCaptcha();
  clearMessages(modalErrorMsg, modalSuccessMsg);
});

nameInput.addEventListener("input", () => {
  if (formStartedTracked || !nameInput.value.trim()) {
    return;
  }
  const payload = buildEnquiryPayload(
    new FormData(enquiryForm),
    currentEnquirySource,
    projectSelect.value
  );
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
  clearMessages(modalErrorMsg, modalSuccessMsg);

  const result = validateForm(enquiryForm, modalCaptcha, "captchaInput");
  if (!result.valid) {
    modalErrorMsg.textContent = result.message || "Unable to submit form.";
    return;
  }

  const formData = new FormData(enquiryForm);
  submitSuccessFlow(formData, currentEnquirySource, projectSelect.value);
});

if (mainEnquiryForm) {
  mainNameInput.addEventListener("input", () => {
    if (mainFormStartedTracked || !mainNameInput.value.trim()) {
      return;
    }
    const payload = buildEnquiryPayload(
      new FormData(mainEnquiryForm),
      "Main website",
      mainProjectSelect.value
    );
    trackWebEngageEvent("Enquire Now Form Started", {
      Source: payload.Source,
      "Project Name": payload["Project Name"],
    });
    mainFormStartedTracked = true;
  });

  mainRefreshCaptcha.addEventListener("click", () => {
    mainCaptchaInput.value = "";
    setMainCaptcha();
    clearMessages(mainErrorMsg, mainSuccessMsg);
  });

  mainEnquiryForm.addEventListener("submit", (event) => {
    event.preventDefault();
    clearMessages(mainErrorMsg, mainSuccessMsg);

    const result = validateForm(mainEnquiryForm, mainCaptcha, "mainCaptchaInput");
    if (!result.valid) {
      mainErrorMsg.textContent = result.message || "Unable to submit form.";
      return;
    }

    const formData = new FormData(mainEnquiryForm);
    submitSuccessFlow(formData, "Main website", mainProjectSelect.value);
  });
}

setModalCaptcha();
setMainCaptcha();

window.addEventListener("load", () => {
  const sourceLabel = "Main website";
  const payload = buildEnquiryPayload(new FormData(enquiryForm), sourceLabel, projectSelect.value);
  trackWebEngageEvent("Enquire Now Clicked", {
    Source: payload.Source,
    "Project Name": payload["Project Name"],
  });
  formStartedTracked = false;
  currentEnquirySource = sourceLabel;
  openModal();
});
