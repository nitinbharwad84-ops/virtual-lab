import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { email, fullName } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create transporter (Optimized for Gmail)
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: (process.env.SMTP_PORT || '465') === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });


    const htmlTemplate = `
      <div style="font-family: 'Outfit', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; background-color: #0a0a1a; color: #f0f0ff; border-radius: 24px; border: 1px solid rgba(255,255,255,0.08);">
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); display: inline-flex; align-items: center; justify-content: center; font-size: 32px;">🔬</div>
          <h1 style="font-size: 32px; font-weight: 800; margin-top: 24px; color: #f0f0ff;">Welcome to Virtual Lab!</h1>
        </div>
        
        <p style="font-size: 16px; line-height: 1.6; color: #a0a0c0;">Hello ${fullName || 'Scientist'},</p>
        
        <p style="font-size: 16px; line-height: 1.6; color: #a0a0c0;">
          We're thrilled to have you join our community of researchers and explorers. Your account has been successfully verified, and you're now ready to start your scientific journey!
        </p>

        <div style="margin: 40px 0; padding: 24px; background: rgba(255,255,255,0.03); border-radius: 16px; border: 1px solid rgba(255,255,255,0.06);">
          <h3 style="margin-top: 0; color: #8b5cf6; font-size: 18px;">What's next?</h3>
          <ul style="padding-left: 20px; color: #a0a0c0; line-height: 1.8;">
            <li>Explore interactive physics simulations</li>
            <li>Perform chemistry titrations in real-time</li>
            <li>Save your experiment results to your dashboard</li>
            <li>Analyze data with our premium graphing tools</li>
          </ul>
        </div>

        <div style="text-align: center; margin-top: 40px;">
          <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/experiments" 
             style="display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #8b5cf6, #06b6d4); color: white; text-decoration: none; font-weight: 700; border-radius: 12px; font-size: 16px;">
            Start Your First Experiment
          </a>
        </div>

        <hr style="margin: 40px 0; border: none; border-top: 1px solid rgba(255,255,255,0.08);" />
        
        <p style="font-size: 12px; color: #6a6a8a; text-align: center;">
          Virtual Lab Team<br />
          Empowering the next generation of scientists.
        </p>
      </div>
    `;

    await transporter.sendMail({
      from: process.env.SMTP_FROM || '"Virtual Lab" <no-reply@virtuallab.com>',
      to: email,
      subject: 'Welcome to Virtual Lab! 🔬',
      html: htmlTemplate,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 });
  }
}
