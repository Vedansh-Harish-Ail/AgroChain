import os
import requests
import smtplib
import socket
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from threading import Thread
from flask import current_app

orig_getaddrinfo = socket.getaddrinfo

def send_async_email(app, msg, mail_server, mail_port, username, password, use_tls):
    # Force IPv4 connection to prevent network unreachable error in Docker/Render environments
    def forced_getaddrinfo(*args, **kwargs):
        if args and args[0] == mail_server:
            new_args = list(args)
            if len(new_args) >= 3:
                new_args[2] = socket.AF_INET
            else:
                while len(new_args) < 3:
                    new_args.append(0)
                new_args[2] = socket.AF_INET
            args = tuple(new_args)
        return orig_getaddrinfo(*args, **kwargs)

    try:
        socket.getaddrinfo = forced_getaddrinfo
        if use_tls:
            server = smtplib.SMTP(mail_server, mail_port, timeout=10)
            server.starttls()
        else:
            server = smtplib.SMTP_SSL(mail_server, mail_port, timeout=10)
            
        server.login(username, password)
        server.send_message(msg)
        server.quit()
        print("[SMTP] Mail sent successfully")
    except Exception as e:
        print(f"[SMTP Error] Connection failed: {e}")
    finally:
        socket.getaddrinfo = orig_getaddrinfo

def send_async_brevo_email(brevo_api_key, sender_email, recipient, subject, text_body, html_body):
    url = "https://api.brevo.com/v3/smtp/email"
    headers = {
        "accept": "application/json",
        "api-key": brevo_api_key,
        "content-type": "application/json"
    }
    payload = {
        "sender": {"name": "AgroChain", "email": sender_email},
        "to": [{"email": recipient}],
        "subject": subject,
        "textContent": text_body,
        "htmlContent": html_body or text_body
    }
    try:
        res = requests.post(url, json=payload, headers=headers, timeout=10)
        if res.status_code in [200, 201, 202]:
            print("[Brevo API] Mail sent successfully")
        else:
            print(f"[Brevo API Error] Status {res.status_code}: {res.text}")
    except Exception as e:
        print(f"[Brevo API Error] Post failed: {e}")

def get_html_template(title, body_text, cta_text=None, cta_url=None):
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
    
    brevo_api_key = os.environ.get('BREVO_API_KEY')
    if brevo_api_key:
        sender_email = os.environ.get('MAIL_DEFAULT_SENDER', 'agroblock.help@gmail.com')
        thr = Thread(target=send_async_brevo_email, args=[
            brevo_api_key, sender_email, recipient, subject, text_body, html_body
        ])
        thr.start()
        return thr
        
    mail_server = app.config.get('MAIL_SERVER')
    mail_port = app.config.get('MAIL_PORT')
    username = app.config.get('MAIL_USERNAME')
    password = app.config.get('MAIL_PASSWORD')
    sender = app.config.get('MAIL_DEFAULT_SENDER')
    use_tls = app.config.get('MAIL_USE_TLS', True)
    
    if not mail_server or not username or not password:
        print(f"\n--- Dev Mail Log (Config Missing) ---")
        print(f"Subject: {subject}")
        print(f"To: {recipient}")
        print(f"Body: {text_body}")
        print(f"-------------------------------------\n")
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
