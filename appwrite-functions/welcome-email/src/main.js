import { Resend } from "resend";

// Triggered by the Appwrite event: users.*.create
export default async ({ req, res, log, error }) => {
  const resend = new Resend(process.env.RESEND_API_KEY);

  let user;
  try {
    user = JSON.parse(req.bodyRaw);
  } catch {
    error("Failed to parse event payload");
    return res.json({ success: false }, 400);
  }

  log(`Sending welcome email to: ${user.email}`);

  try {
    await resend.emails.send({
      from: "onboarding@resend.dev",
      to: "winterlinus4@gmail.com",
      subject: "Willkommen bei der Todo App!",
      html: "<p>Hi,</p><p>dein Account wurde erfolgreich erstellt. Viel Spaß mit deiner Todo App!</p>",
    });

    return res.json({ success: true });
  } catch (err) {
    error(`Failed to send email: ${err.message}`);
    return res.json({ success: false }, 500);
  }
};
