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

    const token = localStorage.getItem('mrt_auth_token');
    const user = localStorage.getItem('mrt_active_session_user');

    if (!token || !user) {
        alert('Session locked. Please sign in again with your username and password.');
        window.location.href = 'portal-login.html';
    }
})();


if (typeof window !== 'undefined') {
    const token = localStorage.getItem('authToken');
    // run gate logic
}