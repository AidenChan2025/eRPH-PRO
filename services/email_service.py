import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os

# Default Config (Fallback)
SMTP_HOST = os.environ.get('SMTP_HOST', 'localhost')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 25))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASS = os.environ.get('SMTP_PASS', '')
FROM_EMAIL = os.environ.get('FROM_EMAIL', 'noreply@erphpro.com')

def send_email(to_email, subject, html_content):
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = to_email

        part = MIMEText(html_content, 'html')
        msg.attach(part)

        # Connect
        if SMTP_USER and SMTP_PASS:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
            server.starttls()
            server.login(SMTP_USER, SMTP_PASS)
        else:
            server = smtplib.SMTP(SMTP_HOST, SMTP_PORT)
        
        server.sendmail(FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        return True
    except Exception as e:
        print(f"EMAIL ERROR: {str(e)}")
        return False

def render_template(template_name, context):
    # Simple template rendering without Jinja2 dependency for now, 
    # but for production robust apps, Jinja2 is better. 
    # We will use simple string replacement or load from templates dir.
    try:
        template_path = os.path.join('templates', 'email', template_name)
        with open(template_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        for key, value in context.items():
            content = content.replace(f'{{{{ {key} }}}}', str(value))
            
        return content
    except Exception as e:
        print(f"TEMPLATE ERROR: {str(e)}")
        return ""

def send_invitation(email, role, school_name, link):
    html = render_template('invitation.html', {
        'role': role,
        'school_name': school_name,
        'link': link,
        'email': email
    })
    return send_email(email, f"Invitation to join eRPH Pro as {role}", html)

def send_newsletter(email, subject, template_name, context):
    # Mapping friendly names to filenames if needed, or pass filename directly
    template_file = f"newsletter_{template_name}.html" if not template_name.endswith('.html') else template_name
    
    # Default context
    if 'action_text' not in context: context['action_text'] = 'Read More'
    if 'action_link' not in context: context['action_link'] = '#'
    
    html = render_template(template_file, context)
    return send_email(email, subject, html)
