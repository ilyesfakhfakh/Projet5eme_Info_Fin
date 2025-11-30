const nodemailer = require('nodemailer');
const { v4: uuidv4 } = require('uuid');
const db = require('../models');
const config = require('../../config/config');

// Configuration du transporteur email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false, // true pour le port 465, false pour les autres ports
  auth: {
    user: process.env.SMTP_USER || config.email?.user || process.env.EMAIL_FROM_ADDRESS,
    pass: process.env.SMTP_PASS || config.email?.password || process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false // À désactiver en production avec un certificat valide
  },
  // Timeout augmenté pour éviter les erreurs de connexion
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Vérification de la connexion SMTP
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Erreur de connexion SMTP:', error);
  } else {
    console.log('✅ Serveur SMTP est prêt à envoyer des messages');
  }
});

// Générer un code OTP à 6 chiffres
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Envoyer un email de vérification
async function sendVerificationEmail(email, otp) {
  try {
    console.log(`[Email] Envoi d'un email de vérification à: ${email}`);
    
    // Options de l'email
    const mailOptions = {
      from: config.email?.from || `"${config.appName || 'Finserve'}" <${process.env.EMAIL_FROM_ADDRESS || config.email?.user || 'noreply@finserve.com'}>`,
      to: email,
      subject: 'Vérification de votre adresse email',
      html: `
        <table width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#f4f5fa">
          <tr>
            <td align="center" style="padding: 40px 0;">
              <table width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px;">
                <!-- En-tête -->
                <tr>
                  <td bgcolor="#7367f0" style="padding: 30px; text-align: center;">
                    <div style="font-family: Arial, sans-serif; font-size: 24px; font-weight: bold; color: #ffffff; margin-bottom: 8px;">Finserve</div>
                    <div style="font-family: Arial, sans-serif; font-size: 14px; color: #e0e0ff;">Votre partenaire financier de confiance</div>
                  </td>
                </tr>
                
                <!-- Contenu principal -->
                <tr>
                  <td bgcolor="#ffffff" style="padding: 40px 30px;">
                    <h1 style="font-family: Arial, sans-serif; color: #2c3e50; font-size: 22px; margin: 0 0 20px 0; text-align: center;">
                      Vérification de votre adresse email
                    </h1>
                    
                    <p style="font-family: Arial, sans-serif; color: #5e5873; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
                      Pour finaliser votre inscription, veuillez utiliser le code de vérification à 6 chiffres ci-dessous :
                    </p>
                    
                    <!-- Code OTP -->
                    <table align="center" cellspacing="0" cellpadding="0" border="0" style="margin: 0 auto 30px auto;">
                      <tr>
                        <td align="center" style="background-color: #f8f8f8; border: 1px dashed #7367f0; border-radius: 8px; padding: 15px 20px;">
                          <span style="font-family: Arial, sans-serif; font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #7367f0; background: #ffffff; padding: 10px 20px; border-radius: 4px; display: inline-block;">
                            ${otp}
                          </span>
                        </td>
                      </tr>
                    </table>
                    
                    <p style="font-family: Arial, sans-serif; color: #5e5873; font-size: 14px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
                      Ce code est valable pendant <strong>15 minutes</strong>.<br>
                      Si vous n'avez pas demandé ce code, veuillez ignorer cet email.
                    </p>
                    
                    <table align="center" cellspacing="0" cellpadding="0" border="0" style="margin: 30px auto 0 auto;">
                      <tr>
                        <td align="center" bgcolor="#7367f0" style="border-radius: 6px;">
                          
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Pied de page -->
                <tr>
                  <td bgcolor="#f8f8f8" style="padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
                    <p style="font-family: Arial, sans-serif; color: #6e6b7b; font-size: 12px; line-height: 1.5; margin: 0 0 10px 0;">
                      © ${new Date().getFullYear()} Finserve. Tous droits réservés.
                    </p>
                    <p style="font-family: Arial, sans-serif; margin: 0;">
                      <a href="#" style="color: #7367f0; text-decoration: none; font-size: 12px; margin: 0 5px;">Confidentialité</a>
                      <span style="color: #cccccc;">|</span>
                      <a href="#" style="color: #7367f0; text-decoration: none; font-size: 12px; margin: 0 5px;">Conditions d'utilisation</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `
    };

    // Envoyer l'email
    await transporter.sendMail(mailOptions);
    console.log(`[Email] Email de vérification envoyé avec succès à: ${email}`);
    
    return { success: true };
  } catch (error) {
    console.error(`[Email] Erreur lors de l'envoi de l'email à ${email}:`, error);
    throw new Error(`Échec de l'envoi de l'email de vérification: ${error.message}`);
  }
}

// Vérifier un code OTP
async function verifyOTP(userId, otpCode) {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log(`[Email] Vérification du code OTP pour l'utilisateur: ${userId}`);
    
    // Vérifier si le code est valide
    const token = await db.email_verification_tokens.findOne({
      where: {
        user_id: userId,
        token: otpCode,
        is_used: false,
        expires_at: { [db.Sequelize.Op.gt]: new Date() }
      },
      transaction
    });

    if (!token) {
      await transaction.rollback();
      console.log(`[Email] Code OTP invalide ou expiré pour l'utilisateur: ${userId}`);
      return { valid: false, message: 'Code de vérification invalide ou expiré' };
    }

    // Marquer le token comme utilisé
    await db.email_verification_tokens.update(
      { is_used: true },
      { where: { id: token.id }, transaction }
    );

    // Valider la transaction
    await transaction.commit();
    console.log(`[Email] Code OTP vérifié avec succès pour l'utilisateur: ${userId}`);
    
    return { valid: true, message: 'Code de vérification valide' };
  } catch (error) {
    await transaction.rollback();
    console.error(`[Email] Erreur lors de la vérification du code OTP pour l'utilisateur ${userId}:`, error);
    throw new Error(`Échec de la vérification du code OTP: ${error.message}`);
  }
}

// Fonction utilitaire pour valider le format d'email
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
}

// Renvoyer le code OTP
async function resendOTP(user) {
  const transaction = await db.sequelize.transaction();
  
  try {
    console.log(`[Email] Demande de renvoi de code OTP pour l'utilisateur: ${user.user_id}`);
    
    // Vérifier que l'utilisateur a un email valide
    if (!user.email || !isValidEmail(user.email)) {
      throw new Error(`L'adresse email de l'utilisateur est invalide: ${user.email}`);
    }
    
    // Supprimer les anciens tokens non utilisés
    await db.email_verification_tokens.destroy({
      where: {
        user_id: user.user_id,
        is_used: false
      },
      transaction
    });

    // Générer un nouveau code OTP
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15); // Expire dans 15 minutes

    // Enregistrer le nouveau token
    await db.email_verification_tokens.create({
      user_id: user.user_id,
      token: otpCode,
      expires_at: expiresAt,
      is_used: false
    }, { transaction });

    // Envoyer l'email de vérification
    await sendVerificationEmail(user.email, otpCode);
    
    await transaction.commit();
    console.log(`[Email] Nouveau code OTP envoyé à l'utilisateur: ${user.user_id}`);
    
    return { success: true, message: 'Un nouveau code de vérification a été envoyé à votre adresse email' };
  } catch (error) {
    await transaction.rollback();
    console.error(`[Email] Erreur lors du renvoi du code OTP pour l'utilisateur ${user.user_id}:`, error);
    throw new Error(`Échec du renvoi du code OTP: ${error.message}`);
  }
}

module.exports = {
  sendVerificationEmail,
  generateOTP,
  transporter,
  verifyOTP,
  resendOTP
};
