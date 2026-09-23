export async function sendApplicationConfirmation(email: string, fullName: string, jobTitle: string, referenceNumber: string) {
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'HireFlow AI <onboarding@resend.dev>',
      to: email,
      subject: `Application received: ${jobTitle}`,
      html: `
        <p>Hi ${fullName},</p>
        <p>Your application for <strong>${jobTitle}</strong> has been received.</p>
        <p>Your reference number is <strong>${referenceNumber}</strong> — keep this for your records.</p>
        <p>You can log in anytime at your candidate dashboard to check your application status.</p>
      `,
    }),
  });
}