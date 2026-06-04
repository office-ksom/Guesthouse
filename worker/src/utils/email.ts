/**
 * Email notification helper for Guesthouse booking approvals.
 * Dispatches real HTML emails via Mailchannels API.
 */
export async function sendGroupApprovalEmail(recipient: string, groupRef: string | null, bookings: any[], senderEmail?: string, senderName?: string) {
  if (!recipient) {
    console.warn('[Email System] No recipient email specified. Skipping email.');
    return;
  }

  const subject = groupRef 
    ? `KSoM Guesthouse Booking Approval - Group Request ${groupRef}`
    : `KSoM Guesthouse Booking Approval - ${bookings[0]?.booking_ref || 'Confirmation'}`;

  // Format HTML guest rows
  const bookingRows = bookings.map((b, idx) => {
    const statusText = b.status === 'confirmed' ? 'APPROVED & ALLOTTED' : b.status.toUpperCase();
    const statusColor = b.status === 'confirmed' ? '#059669' : '#dc2626';
    return `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #f8fafc;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #0f172a; font-size: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Guest #${idx + 1}</h4>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 4px 0; color: #64748b; width: 130px;">Name:</td>
            <td style="padding: 4px 0; color: #0f172a; font-weight: 600;">${b.guest_name}</td>
          </tr>
          ${b.designation ? `
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Designation:</td>
            <td style="padding: 4px 0; color: #0f172a;">${b.designation}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Reference:</td>
            <td style="padding: 4px 0; color: #0f172a; font-family: monospace; font-weight: 600;">${b.booking_ref}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Stay Dates:</td>
            <td style="padding: 4px 0; color: #0f172a;">${b.check_in_date} to ${b.check_out_date}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Room Allotted:</td>
            <td style="padding: 4px 0; color: #003366; font-weight: 600;">${b.room_name || 'Not Allotted'}</td>
          </tr>
          <tr>
            <td style="padding: 4px 0; color: #64748b;">Status:</td>
            <td style="padding: 4px 0; color: ${statusColor}; font-weight: 700;">${statusText}</td>
          </tr>
        </table>
      </div>
    `;
  }).join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${subject}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #334155;">
      <div style="max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border: 1px solid #e2e8f0;">
        <!-- Header -->
        <div style="background-color: #003366; padding: 30px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">KSoM Guesthouse</h1>
          <p style="margin: 5px 0 0 0; color: #ff9933; font-size: 14px; font-weight: 600; text-transform: uppercase;">Room Allotment Confirmation</p>
        </div>
        
        <!-- Content -->
        <div style="padding: 30px;">
          <p style="margin-top: 0; font-size: 16px; line-height: 1.6; color: #334155;">Dear Sir/Madam,</p>
          <p style="font-size: 15px; line-height: 1.6; color: #334155; margin-bottom: 25px;">
            We are pleased to inform you that your room booking request(s) for the KSoM Guesthouse have been approved. Below are the allotment details:
          </p>
          
          ${bookingRows}
          
          <div style="margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            <p style="font-size: 14px; line-height: 1.6; color: #64748b; margin: 0;">
              Thank you,<br>
              <strong>KSoM Guesthouse Administration</strong><br>
              Kerala School of Mathematics, Kozhikode<br>
              <a href="mailto:guesthouse@ksom.res.in" style="color: #003366; text-decoration: none;">guesthouse@ksom.res.in</a> | +91-495-2809000
            </p>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8;">
          This is an automated confirmation email sent by the KSoM Guesthouse Portal.
        </div>
      </div>
    </body>
    </html>
  `;

  const payload = {
    personalizations: [
      {
        to: [{ email: recipient }]
      }
    ],
    from: {
      email: senderEmail || "guesthouse@ksom.res.in",
      name: senderName || "KSoM Guesthouse"
    },
    subject: subject,
    content: [
      {
        type: "text/html",
        value: htmlBody
      }
    ]
  };

  try {
    const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Mailchannels API error: ${res.status} - ${errText}`);
    }

    console.info(`[Email System] Email successfully dispatched via Mailchannels to ${recipient}`);
  } catch (err: any) {
    console.error(`[Email System] Failed to dispatch email via Mailchannels to ${recipient}:`, err.message);
    // Log fallback to console in local development
    console.info("========================================================================");
    console.info(`✉️ FALLBACK SIMULATED EMAIL FROM: ${senderName || 'KSoM Guesthouse'} <${senderEmail || 'guesthouse@ksom.res.in'}> TO: ${recipient}`);
    console.info(`📂 SUBJECT: ${subject}`);
    console.info("------------------------------------------------------------------------");
    bookings.forEach((b, idx) => {
      console.info(`Guest #${idx + 1}: ${b.guest_name} | Room: ${b.room_name || 'Not Allotted'} | Status: ${b.status}`);
    });
    console.info("========================================================================");
  }
}
