export async function onRequestPost(context) {
  try {
    // Parse form data
    const formData = await context.request.formData();
    const name = formData.get("name")?.trim();
    const email = formData.get("email")?.trim();
    const phone = formData.get("phone")?.trim();
    const message = formData.get("message")?.trim();
    const privacy = formData.get("privacy");

    // Validation
    const errors = [];

    if (!name || name.length < 2 || name.length > 100) {
      errors.push("Name muss zwischen 2 und 100 Zeichen lang sein");
    }

    if (!email || !isValidEmail(email)) {
      errors.push("Gültige E-Mail-Adresse erforderlich");
    }

    if (!message || message.length < 10 || message.length > 1000) {
      errors.push("Nachricht muss zwischen 10 und 1000 Zeichen lang sein");
    }

    // Phone validation (optional field)
    if (phone && !isValidPhone(phone)) {
      errors.push("Telefonnummer ist ungültig");
    }

    // Privacy consent validation
    if (!privacy || privacy !== "on") {
      errors.push("Datenschutz-Zustimmung ist erforderlich");
    }

    if (errors.length > 0) {
      return new Response(errors.join(", "), {
        status: 400,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    // Check for API key
    const apiKey = context.env.RESEND_API_KEY;
    if (!apiKey) {
      console.error("RESEND_API_KEY not configured");
      return new Response("Server-Konfigurationsfehler", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const to = "moritsweba@gmail.com";

    // Sanitize inputs for email content
    const sanitizedName = sanitizeText(name);
    const sanitizedMessage = sanitizeText(message);
    const sanitizedPhone = phone ? sanitizeText(phone) : null;

    // Send email via Resend API
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "mediaMW Kontakt <onboarding@resend.dev>",
        to,
        subject: `Neue Kontaktanfrage von ${sanitizedName}`,
        reply_to: email,
        text: `Neue Nachricht über das Kontaktformular:

Von: ${sanitizedName}
E-Mail: ${email}${sanitizedPhone ? `\nTelefon: ${sanitizedPhone}` : ''}
Datum: ${new Date().toLocaleString('de-DE')}

Nachricht:
${sanitizedMessage}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; border-bottom: 2px solid #667eea; padding-bottom: 10px;">
              Neue Kontaktanfrage
            </h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Von:</strong> ${sanitizedName}</p>
              <p><strong>E-Mail:</strong> <a href="mailto:${email}">${email}</a></p>
              ${sanitizedPhone ? `<p><strong>Telefon:</strong> <a href="tel:${sanitizedPhone}">${sanitizedPhone}</a></p>` : ''}
              <p><strong>Datum:</strong> ${new Date().toLocaleString('de-DE')}</p>
            </div>
            <div style="margin: 20px 0;">
              <h3 style="color: #333;">Nachricht:</h3>
              <div style="background: white; padding: 15px; border-left: 4px solid #667eea; border-radius: 4px;">
                ${sanitizedMessage.replace(/\n/g, '<br>')}
              </div>
            </div>
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #666; font-size: 12px;">
              Diese E-Mail wurde über das Kontaktformular Ihrer Website gesendet.
            </p>
          </div>
        `
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Resend API error:", response.status, errorText);
      return new Response("Fehler beim E-Mail-Versand", {
        status: 500,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    }

    const result = await response.json();
    console.log("Email sent successfully:", result.id);

    return new Response("Nachricht erfolgreich gesendet", {
      status: 200,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });

  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response("Ein unerwarteter Fehler ist aufgetreten", {
      status: 500,
      headers: { "Content-Type": "text/plain; charset=utf-8" }
    });
  }
}

// Helper function to validate email
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

// Helper function to validate phone number
function isValidPhone(phone) {
  // Allow international format, spaces, dashes, parentheses
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{5,20}$/;
  return phoneRegex.test(phone);
}

// Helper function to sanitize text content
function sanitizeText(text) {
  return text
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/\r\n/g, '\n') // Normalize line endings
    .trim();
}
