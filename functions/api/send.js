export async function onRequestPost(context) {
  const formData = await context.request.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  const apiKey = context.env.RESEND_API_KEY;
  const to = "moritsweba@gmail.com";

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "mediaMW Kontakt <onboarding@resend.dev>",
      to,
      subject: "Neue Nachricht von deiner Website",
      reply_to: email,
      text: `Von: ${name} <${email}>\n\n${message}`,
    }),
  });

  return response.ok
    ? new Response("Erfolg", { status: 200 })
    : new Response("Fehler beim Senden", { status: 500 });
}
