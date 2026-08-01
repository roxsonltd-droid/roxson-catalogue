"use server";

import { Resend } from "resend";

export type ContactResult = {
  ok: boolean;
  error?: string;
};

export async function sendContactEmail(formData: FormData): Promise<ContactResult> {
  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const email = (formData.get("email") as string | null)?.trim() ?? "";
  const company = (formData.get("company") as string | null)?.trim() ?? "";
  const message = (formData.get("message") as string | null)?.trim() ?? "";

  if (!name || !email || !message) {
    return { ok: false, error: "Name, email and message are required." };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Please provide a valid email address." };
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("RESEND_API_KEY is not configured.");
    return { ok: false, error: "Email service is not configured." };
  }

  const resend = new Resend(apiKey);
  const to = process.env.CONTACT_EMAIL || "roxson.ltd@gmail.com";
  const from = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: email,
    subject: `Catalogue request from ${name}${company ? ` (${company})` : ""}`,
    text: [
      `New contact form submission from the ROXSON LTD catalogue site.`,
      ``,
      `Name: ${name}`,
      `Email: ${email}`,
      company ? `Company: ${company}` : null,
      ``,
      `Message:`,
      message,
    ]
      .filter((line): line is string => line !== null)
      .join("\n"),
  });

  if (error) {
    console.error("Resend error:", error);
    return { ok: false, error: "Failed to send the message. Please try again." };
  }

  return { ok: true };
}
