(function() {
    'use strict';
    window.addEventListener('load', function() {
        var form = document.getElementById('registrationForm');
        var password = document.getElementById('password');
        var confirmPassword = document.getElementById('confirmPassword');
        var passwordMismatch = document.getElementById('passwordMismatch');
        var passwordInvalid = document.getElementById('passwordInvalid');

        function validatePassword() {
            var regex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;
            return regex.test(password.value);
        }

        function checkPasswords() {
            if (password.value !== confirmPassword.value) {
                passwordMismatch.style.display = 'block';
                confirmPassword.classList.add('is-invalid');
            } else {
                passwordMismatch.style.display = 'none';
                confirmPassword.classList.remove('is-invalid');
            }
        }

        function checkPasswordCriteria() {
            if (!validatePassword()) {
                passwordInvalid.style.display = 'block';
                password.classList.add('is-invalid');
            } else {
                passwordInvalid.style.display = 'none';
                password.classList.remove('is-invalid');
            }
        }

        form.addEventListener('submit', function(event) {
            if (form.checkValidity() === false || password.value !== confirmPassword.value || !validatePassword()) {
                event.preventDefault();
                event.stopPropagation();

                checkPasswords();
                checkPasswordCriteria();

                form.classList.add('was-validated');
            } else {
                passwordMismatch.style.display = 'none';
                confirmPassword.classList.remove('is-invalid');
                passwordInvalid.style.display = 'none';
                password.classList.remove('is-invalid');
            }
        }, false);

        confirmPassword.addEventListener('input', checkPasswords);
        password.addEventListener('input', checkPasswordCriteria);
    }, false);
})();
