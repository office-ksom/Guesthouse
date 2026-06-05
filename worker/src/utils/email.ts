import { Env } from '../types';

/**
 * Email notification helper for Guesthouse booking approvals.
 * Dispatches real HTML emails via Google Gmail API (OAuth), Resend, Brevo, SendGrid, or Mailchannels.
 */
export async function sendGroupApprovalEmail(
  env: Env,
  recipient: string,
  groupRef: string | null,
  bookings: any[],
  senderEmail?: string,
  senderName?: string
): Promise<{ success: boolean; log: string }> {
  if (!recipient) {
    console.warn('[Email System] No recipient email specified. Skipping email.');
    return { success: false, log: 'No recipient email specified' };
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

  // Always send From the system's email address to avoid domain authentication violations
  const fromEmail = env.EMAIL_FROM_ADDRESS || "guesthouse@ksom.res.in";
  const fromName = env.EMAIL_FROM_NAME || "KSoM Guesthouse";

  let success = false;
  let diagnosticLog = '';

  // 1. Try Google Gmail API (OAuth2)
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_REFRESH_TOKEN) {
    try {
      // Exchange refresh token for an access token
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          refresh_token: env.GOOGLE_REFRESH_TOKEN,
          grant_type: "refresh_token"
        })
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        throw new Error(`OAuth token refresh failed: ${tokenRes.status} - ${errText}`);
      }

      const tokenData = await tokenRes.json<{ access_token: string }>();
      const accessToken = tokenData.access_token;

      // Construct raw MIME email message (RFC 2822)
      // Gmail API requires a Base64url-encoded raw message
      const rawMessage = [
        `From: ${fromName} <${fromEmail}>`,
        `To: ${recipient}`,
        ...(senderEmail ? [`Reply-To: ${senderName || senderEmail} <${senderEmail}>`] : []),
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        '',
        htmlBody
      ].join('\r\n');

      // Convert raw MIME string to base64url encoding
      const encodedRaw = btoa(unescape(encodeURIComponent(rawMessage)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      const gmailRes = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          raw: encodedRaw
        })
      });

      if (gmailRes.ok) {
        success = true;
        console.info(`[Email System] Email successfully dispatched via Gmail API (Google OAuth2) to ${recipient}`);
      } else {
        const errText = await gmailRes.text();
        diagnosticLog += `Gmail API failed: ${gmailRes.status} - ${errText}. `;
      }
    } catch (e: any) {
      diagnosticLog += `Gmail API error: ${e.message}. `;
    }
  }

  // 2. Try Resend
  if (!success && env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${fromName} <${fromEmail}>`,
          to: [recipient],
          reply_to: senderEmail || undefined,
          subject: subject,
          html: htmlBody
        })
      });

      if (res.ok) {
        success = true;
        console.info(`[Email System] Email successfully dispatched via Resend to ${recipient}`);
      } else {
        const errText = await res.text();
        diagnosticLog += `Resend API failed: ${res.status} - ${errText}. `;
      }
    } catch (e: any) {
      diagnosticLog += `Resend error: ${e.message}. `;
    }
  }

  // 3. Try Brevo
  if (!success && env.BREVO_API_KEY) {
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": env.BREVO_API_KEY,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          sender: { name: fromName, email: fromEmail },
          to: [{ email: recipient }],
          replyTo: senderEmail ? { email: senderEmail, name: senderName } : undefined,
          subject: subject,
          htmlContent: htmlBody
        })
      });

      if (res.ok) {
        success = true;
        console.info(`[Email System] Email successfully dispatched via Brevo to ${recipient}`);
      } else {
        const errText = await res.text();
        diagnosticLog += `Brevo API failed: ${res.status} - ${errText}. `;
      }
    } catch (e: any) {
      diagnosticLog += `Brevo error: ${e.message}. `;
    }
  }

  // 4. Try SendGrid
  if (!success && env.SENDGRID_API_KEY) {
    try {
      const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${env.SENDGRID_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient }] }],
          from: { name: fromName, email: fromEmail },
          reply_to: senderEmail ? { email: senderEmail, name: senderName } : undefined,
          subject: subject,
          content: [{ type: "text/html", value: htmlBody }]
        })
      });

      if (res.ok) {
        success = true;
        console.info(`[Email System] Email successfully dispatched via SendGrid to ${recipient}`);
      } else {
        const errText = await res.text();
        diagnosticLog += `SendGrid API failed: ${res.status} - ${errText}. `;
      }
    } catch (e: any) {
      diagnosticLog += `SendGrid error: ${e.message}. `;
    }
  }

  // 5. Fallback to Mailchannels
  if (!success) {
    const mcHeaders: Record<string, string> = { "Content-Type": "application/json" };
    if (env.MAILCHANNELS_API_KEY) {
      mcHeaders["X-Api-Key"] = env.MAILCHANNELS_API_KEY;
    }

    const payload = {
      personalizations: [{ to: [{ email: recipient }] }],
      from: { name: fromName, email: fromEmail },
      reply_to: senderEmail ? { email: senderEmail, name: senderName } : undefined,
      subject: subject,
      content: [{ type: "text/html", value: htmlBody }]
    };

    try {
      const res = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: mcHeaders,
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        success = true;
        console.info(`[Email System] Email successfully dispatched via Mailchannels to ${recipient}`);
      } else {
        const errText = await res.text();
        diagnosticLog += `Mailchannels API failed: ${res.status} - ${errText}. `;
        throw new Error(`Mailchannels API error: ${res.status} - ${errText}`);
      }
    } catch (err: any) {
      console.error(`[Email System] Failed to dispatch email via Mailchannels to ${recipient}:`, err.message);
      // Log simulated fallback details
      console.info("========================================================================");
      console.info(`✉️ FALLBACK SIMULATED EMAIL FROM: ${fromName} <${fromEmail}> TO: ${recipient}`);
      console.info(`📂 SUBJECT: ${subject}`);
      console.info("------------------------------------------------------------------------");
      bookings.forEach((b, idx) => {
        console.info(`Guest #${idx + 1}: ${b.guest_name} | Room: ${b.room_name || 'Not Allotted'} | Status: ${b.status}`);
      });
      console.info("========================================================================");
      console.info(`[Provider Diagnostics] ${diagnosticLog}`);
    }
  }

  return { success, log: diagnosticLog };
}
