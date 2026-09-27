(async function() {
    const currentPage = window.location.pathname.split('/').pop();
    const publicPages = [
        'portal-login.html',
        'index.html',
        'about.html',
        'membership.html',
        'gallery.html'
    ];

    if (publicPages.includes(currentPage)) {
        return;
    }

    try {
        const response = await fetch('/api/auth/session', { credentials: 'include' });
        if (!response.ok) {
            throw new Error('Session invalid');
        }
    } catch (error) {
        alert('Session locked. Please sign in again with your username and password.');
        window.location.href = 'portal-login.html';
    }
})();