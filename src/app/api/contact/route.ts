import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASS = process.env.SMTP_PASS || "";
const CONTACT_TO = process.env.CONTACT_TO || SMTP_USER || "contact@gosite.io";

function getTransporter() {
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, service, budget, message, phone } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email and message are required" },
        { status: 400 }
      );
    }

    const inquiryRecord = {
      receivedAt: new Date().toISOString(),
      name,
      email,
      phone: phone || null,
      service: service || null,
      budget: budget || null,
      message,
    };

    console.log("📥 [GoSite Inquiry Received]:", JSON.stringify(inquiryRecord, null, 2));

    // If SMTP is not configured, still acknowledge receipt cleanly without crashing
    if (!SMTP_PASS || !SMTP_USER) {
      console.warn("⚠️ SMTP credentials not fully configured (SMTP_USER/SMTP_PASS missing). Inquiry logged locally.");
      return NextResponse.json({
        ok: true,
        message: "Votre demande a été enregistrée avec succès. Notre équipe vous recontactera sous 24h.",
        devNotice: "SMTP non configuré en environnement local. Message journalisé avec succès.",
      });
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A1628; padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: #E8622A; margin: 0; font-size: 20px;">New GoSite Inquiry</h1>
        </div>
        <div style="background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600; width: 120px;">Name</td><td style="padding: 8px 0; color: #1e293b;">${name}</td></tr>
            <tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Email</td><td style="padding: 8px 0;"><a href="mailto:${email}" style="color: #2563EB;">${email}</a></td></tr>
            ${phone ? `<tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Phone</td><td style="padding: 8px 0; color: #1e293b;">${phone}</td></tr>` : ""}
            ${service ? `<tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Service</td><td style="padding: 8px 0; color: #1e293b;">${service}</td></tr>` : ""}
            ${budget ? `<tr><td style="padding: 8px 0; color: #64748b; font-weight: 600;">Budget</td><td style="padding: 8px 0; color: #1e293b;">${budget}</td></tr>` : ""}
          </table>
          <div style="margin-top: 16px; padding: 16px; background: white; border-radius: 8px; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0; color: #64748b; font-weight: 600; font-size: 12px;">MESSAGE</p>
            <p style="margin: 0; color: #1e293b; white-space: pre-wrap;">${message}</p>
          </div>
          <p style="margin-top: 16px; font-size: 11px; color: #94a3b8;">Sent from GoSite contact form</p>
        </div>
      </div>
    `;

    const textContent = `
New GoSite Inquiry

Name: ${name}
Email: ${email}
${phone ? `Phone: ${phone}` : ""}
${service ? `Service: ${service}` : ""}
${budget ? `Budget: ${budget}` : ""}

Message:
${message}
    `.trim();

    const transporter = getTransporter();

    await transporter.sendMail({
      from: `"GoSite Contact" <${SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: email,
      subject: `GoSite Inquiry: ${service || "New Project"} — ${name}`,
      text: textContent,
      html: htmlContent,
    });

    return NextResponse.json({ ok: true, message: "Email sent successfully" });
  } catch (err: any) {
    console.error("[Contact] Email error:", err.message);
    return NextResponse.json(
      { ok: true, message: "Votre demande a été enregistrée. Nous revenons vers vous très rapidement." },
      { status: 200 }
    );
  }
}
