from app import create_app
from utils.email import send_email, get_html_template
import time

app = create_app()

with app.app_context():
    recipient = "kshamyaamin19@gmail.com"
    subject = "AgroChain SMTP Test Email"
    text_body = "This is a test email from your AgroChain integration to verify that SMTP is working correctly."
    html_body = get_html_template(
        title="SMTP Test Successful!",
        body_text="<p>Hello,</p><p>This is a test email sent from the AgroChain platform to confirm your Gmail SMTP configuration is active and working correctly.</p><p>If you received this, your email notifications are now fully operational!</p>"
    )
    
    print(f"Sending test email to {recipient}...")
    print(f"SMTP Server: {app.config.get('MAIL_SERVER')}")
    print(f"SMTP Username: {app.config.get('MAIL_USERNAME')}")
    
    thr = send_email(subject, recipient, text_body, html_body)
    if thr:
        print("Async email sending thread started successfully! Exiting script immediately...")
    else:
        print("\n--- WARNING: Email was not sent because SMTP config is missing ---")
        print("Please check your Backend/.env file and make sure MAIL_SERVER, MAIL_USERNAME, and MAIL_PASSWORD are set.")

