async function checkEmailWithHIBP(email, token) {
  const resp = await fetch("/.netlify/functions/check-breach", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, token })
  });

  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

document.getElementById("hibp-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const resultBox = document.getElementById("result");
  resultBox.textContent = "Checking...";

  const token = grecaptcha.getResponse(); // Get CAPTCHA token
  if (!token) {
    resultBox.textContent = "❌ Please complete the CAPTCHA.";
    return;
  }

  try {
    const result = await checkEmailWithHIBP(email, token);
    if (result.breached) {
      resultBox.textContent = `⚠️ Breached in ${result.count} services. Consider changing passwords and enabling MFA.`;
    } else {
      resultBox.textContent = `✅ No breaches found. You're good!`;
    }
  } catch (err) {
    resultBox.textContent = `❌ Error: ${err.message}`;
  }

  grecaptcha.reset(); // Reset CAPTCHA after submission
});
