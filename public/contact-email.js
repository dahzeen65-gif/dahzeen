const contactForm = document.getElementById('contactForm');

if (contactForm) {
    const status = document.getElementById('contactFormStatus');
    const submitButton = contactForm.querySelector('[type="submit"]');

    contactForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (submitButton) submitButton.disabled = true;
        if (status) {
            status.textContent = 'Sending your message…';
            status.style.color = '';
        }

        try {
            if (!window.emailjs) {
                throw new Error('Email service is not available. Please try again later.');
            }

            const configResponse = await fetch('/api/config/emailjs');
            const config = await configResponse.json();
            if (!configResponse.ok) {
                throw new Error('Unable to load email settings. Please try again later.');
            }
            if (!config.serviceId || !config.contactTemplateId || !config.publicKey) {
                throw new Error('The contact email service is not configured yet.');
            }

            const formData = new FormData(contactForm);
            const name = String(formData.get('name') || '').trim();
            const email = String(formData.get('email') || '').trim();
            const subject = String(formData.get('subject') || '').trim();
            const message = String(formData.get('message') || '').trim();

            await window.emailjs.send(
                config.serviceId,
                config.contactTemplateId,
                {
                    to_email: 'miritiniresponset@gmail.com',
                    from_name: name,
                    from_email: email,
                    reply_to: email,
                    subject,
                    message
                },
                { publicKey: config.publicKey }
            );

            contactForm.reset();
            if (status) {
                status.textContent = 'Thank you. Your message has been sent successfully.';
                status.style.color = 'green';
            }
        } catch (error) {
            console.error('Contact message could not be sent:', error);
            if (status) {
                status.textContent = error.message || 'Unable to send your message. Please try again.';
                status.style.color = '#b00020';
            }
        } finally {
            if (submitButton) submitButton.disabled = false;
        }
    });
}
