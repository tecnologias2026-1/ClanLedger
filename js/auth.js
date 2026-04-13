document.addEventListener('DOMContentLoaded', () => {

    // --- LÓGICA PARA EL LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Iniciando sesión...");
            window.location.href = "transacciones.html";
        });
    }

    // --- LÓGICA PARA EL REGISTRO ---
    const registroForm = document.getElementById('registroForm');
    if (registroForm) {
        registroForm.addEventListener('submit', (e) => {
            e.preventDefault();
            console.log("Creando cuenta...");
            // Aquí podrías validar que las contraseñas coincidan, etc.
            window.location.href = "transacciones.html";
        });
    }

});