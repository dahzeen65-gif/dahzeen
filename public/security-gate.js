(function() {
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

    const redirectToLogin = (message = 'Session locked. Please sign in again with your username and password.') => {
        alert(message);
        fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        }).finally(() => {
            window.location.replace('portal-login.html');
        });
    };

    async function verifySession() {
        try {
            const response = await fetch('/api/auth/session', { credentials: 'include' });
            if (!response.ok) {
                throw new Error('Session invalid');
            }
        } catch (error) {
            redirectToLogin();
        }
    }

    verifySession();

    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            verifySession();
        }
    });

    document.addEventListener('visibilitychange', function() {
        if (document.visibilityState === 'visible') {
            verifySession();
        }
    });

    window.addEventListener('popstate', function() {
        verifySession();
    });
})();
