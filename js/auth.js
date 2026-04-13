document.addEventListener('DOMContentLoaded', () => {

    //  LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.href = "dashboard.html";
        });
    }

    //  REGISTRO ---
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            window.location.href = "dashboard.html";
        });
    }

});