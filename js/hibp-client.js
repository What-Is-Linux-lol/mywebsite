async function checkEmailWithHIBP(email) {
  const resp = await fetch(`/.netlify/functions/check-breach?email=${encodeURIComponent(email)}`);
  if (!resp.ok) throw new Error(await resp.text());
  return await resp.json();
}

document.getElementById("hibp-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("email").value;
  const resultBox = document.getElementById("result");
  resultBox.textContent = "Checking...";
  try {
    const result = await checkEmailWithHIBP(email);
    if (result.breached) {
      resultBox.textContent = `⚠️ Breached in ${result.count} services. Consider changing passwords and enabling MFA.`;
    } else {
      resultBox.textContent = `✅ No breaches found. You're good!`;
    }
  } catch (err) {
    resultBox.textContent = `❌ Error: ${err.message}`;
  }
});
