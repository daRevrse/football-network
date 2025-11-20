const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    // Configuration du transporteur email
    // En développement, on peut utiliser un service comme Ethereal ou Mailtrap
    // En production, utiliser un vrai service SMTP (Gmail, SendGrid, etc.)

    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.ethereal.email",
      port: process.env.SMTP_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.fromEmail = process.env.FROM_EMAIL || "noreply@football-network.com";
    this.frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  }

  async sendPasswordResetEmail(email, token, firstName) {
    const resetLink = `${this.frontendUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"Football Network" <${this.fromEmail}>`,
      to: email,
      subject: "Réinitialisation de votre mot de passe",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              padding-bottom: 20px;
              border-bottom: 2px solid #10b981;
            }
            .header h1 {
              color: #10b981;
              margin: 0;
            }
            .content {
              padding: 30px 0;
            }
            .button {
              display: inline-block;
              padding: 14px 28px;
              background-color: #10b981;
              color: #ffffff;
              text-decoration: none;
              border-radius: 8px;
              font-weight: bold;
              margin: 20px 0;
            }
            .button:hover {
              background-color: #059669;
            }
            .footer {
              text-align: center;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚽ Football Network</h1>
            </div>

            <div class="content">
              <h2>Bonjour ${firstName || ""},</h2>

              <p>Vous avez demandé la réinitialisation de votre mot de passe.</p>

              <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>

              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Réinitialiser mon mot de passe</a>
              </div>

              <p>Ou copiez ce lien dans votre navigateur :</p>
              <p style="word-break: break-all; color: #6b7280; font-size: 14px;">
                ${resetLink}
              </p>

              <div class="warning">
                <strong>⚠️ Important :</strong> Ce lien est valable pendant 1 heure. Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.
              </div>
            </div>

            <div class="footer">
              <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
              <p>&copy; ${new Date().getFullYear()} Football Network. Tous droits réservés.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Bonjour ${firstName || ""},

        Vous avez demandé la réinitialisation de votre mot de passe.

        Cliquez sur ce lien pour créer un nouveau mot de passe :
        ${resetLink}

        Ce lien est valable pendant 1 heure.

        Si vous n'avez pas demandé cette réinitialisation, veuillez ignorer cet email.

        Football Network
      `,
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("📧 Email sent:", info.messageId);

      // Si on utilise Ethereal (dev), afficher le lien de preview
      if (process.env.SMTP_HOST === "smtp.ethereal.email") {
        console.log("📧 Preview URL:", nodemailer.getTestMessageUrl(info));
      }

      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending email:", error);
      throw new Error("Failed to send password reset email");
    }
  }

  async sendWelcomeEmail(email, firstName) {
    const mailOptions = {
      from: `"Football Network" <${this.fromEmail}>`,
      to: email,
      subject: "Bienvenue sur Football Network ! ⚽",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background: #ffffff;
              border-radius: 10px;
              padding: 30px;
              box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 style="color: #10b981;">Bienvenue sur Football Network ! ⚽</h1>
            <p>Bonjour ${firstName},</p>
            <p>Merci de vous être inscrit ! Vous pouvez maintenant créer ou rejoindre des équipes.</p>
            <p>Bonne chance sur le terrain !</p>
          </div>
        </body>
        </html>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log("📧 Welcome email sent to:", email);
    } catch (error) {
      console.error("❌ Error sending welcome email:", error);
    }
  }
}

module.exports = new EmailService();
