import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread
from flask import current_app

def send_async_email(app, msg, mail_server, mail_port, username, password, use_tls):
    try:
        if use_tls:
            server = smtplib.SMTP(mail_server, mail_port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(mail_server, mail_port, timeout=10)
            
        server.login(username, password)
        server.send_message(msg)
        server.quit()
        print("[EMAIL SYSTEM] Email dispatched successfully!")
    except Exception as e:
        print(f"[EMAIL SYSTEM ERROR] Failed to send email: {e}")

def get_html_template(title, body_text, cta_text=None, cta_url=None):
    """Returns a beautiful, premium green-themed email template."""
    cta_button = ""
    if cta_text and cta_url:
        cta_button = f'''
        <div style="margin: 30px 0; text-align: center;">
            <a href="{cta_url}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">{cta_text}</a>
        </div>
        '''
        
    return f'''
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                background-color: #f3f4f6;
                margin: 0;
                padding: 20px;
                color: #1f2937;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                border: 1px solid #e5e7eb;
            }}
            .header {{
                background-color: #064e3b;
                color: #ffffff;
                padding: 30px 20px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 24px;
                font-weight: 800;
                letter-spacing: 0.05em;
            }}
            .content {{
                padding: 30px 20px;
                line-height: 1.6;
            }}
            .footer {{
                background-color: #f9fafb;
                padding: 20px;
                text-align: center;
                font-size: 12px;
                color: #6b7280;
                border-top: 1px solid #f3f4f6;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>AgroChain</h1>
            </div>
            <div class="content">
                <h2 style="color: #065f46; margin-top: 0;">{title}</h2>
                {body_text}
                {cta_button}
                <p style="margin-top: 30px; font-size: 13px; color: #6b7280;">
                    Best regards,<br>
                    <strong>AgroChain Team</strong>
                </p>
            </div>
            <div class="footer">
                <p>This is an automated operational notification from AgroChain.</p>
                <p>&copy; 2026 AgroChain Transparency & Microfinance Registry.</p>
            </div>
        </div>
    </body>
    </html>
    '''

def send_email(subject, recipient, text_body, html_body=None):
    app = current_app._get_current_object()
    
    mail_server = app.config.get('MAIL_SERVER')
    mail_port = app.config.get('MAIL_PORT')
    username = app.config.get('MAIL_USERNAME')
    password = app.config.get('MAIL_PASSWORD')
    sender = app.config.get('MAIL_DEFAULT_SENDER')
    use_tls = app.config.get('MAIL_USE_TLS', True)
    
    if not mail_server or not username or not password:
        # Fallback to dev print log if not configured
        print(f"\n--- [MAIL DEV FALLBACK - CONFIG MISSING] ---")
        print(f"Subject: {subject}")
        print(f"To: {recipient}")
        print(f"Body: {text_body}")
        print(f"--------------------------------------------\n")
        return None
        
    msg = MIMEMultipart('alternative')
    msg['Subject'] = subject
    msg['From'] = sender
    msg['To'] = recipient
    
    part1 = MIMEText(text_body, 'plain')
    msg.attach(part1)
    
    if html_body:
        part2 = MIMEText(html_body, 'html')
        msg.attach(part2)
        
    thr = Thread(target=send_async_email, args=[app, msg, mail_server, mail_port, username, password, use_tls])
    thr.start()
    return thr
