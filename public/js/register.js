let formButton = document.querySelectorAll('.login-form-button')[0];
formButton.addEventListener('click', userRegister);

function userRegister() {
    let userName = document.getElementById('userName').value;
    let userSurname = document.getElementById('userSurname').value;
    let userEmail = document.getElementById('userEmail').value;
    let userPassword = document.getElementById('userPassword').value;
    let userRePassword = document.getElementById('userRePassword').value;
    let formContainer = document.querySelectorAll('.form-info')[0];
    formContainer.style.transition = '0.2s';

    // Sprawdzamy, czy hasła są zgodne
    if (userPassword !== userRePassword) {
        formContainer.innerHTML = '';
        let errorContainer = document.createElement('div');
        errorContainer.classList.add('error');
        errorContainer.style.display = 'flex';
        errorContainer.style.padding = '10px';
        errorContainer.style.transition = '0.2s';
        errorContainer.style.justifyContent = 'center';
        errorContainer.style.backgroundColor = '#ff9b9b'; // Czerwony kolor
        errorContainer.style.borderRadius = '10px';

        let errorContent = document.createElement('h5');
        errorContent.textContent = 'Hasła nie są zgodne!';  // Błąd, gdy hasła nie pasują
        errorContainer.appendChild(errorContent);
        formContainer.appendChild(errorContainer);
        return;
    }

    // Wysyłanie danych rejestracji do serwera
    fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: userName,
            surname: userSurname,
            email: userEmail,
            password: userPassword,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Rejestracja nie powiodła się: ' + response.status); // Obsługuje błędy HTTP
            }
            return response.json();
        })
        .then(data => {
            formContainer.innerHTML = ''; // Czyszczenie poprzednich komunikatów

            // Komunikat o sukcesie
            let successContainer = document.createElement('div');
            successContainer.classList.add('success');
            successContainer.style.display = 'flex';
            successContainer.style.padding = '10px';
            successContainer.style.transition = '0.2s';
            successContainer.style.justifyContent = 'center';
            successContainer.style.backgroundColor = '#9bffa2'; // Zielony kolor
            successContainer.style.borderRadius = '10px';

            let successContent = document.createElement('h5');
            successContainer.style.textAlign = 'center'
            successContent.textContent = data.message || 'Rejestracja zakończona sukcesem! Sprawdź maila i zweryfikuj konto!'; // Jeśli serwer zwróci wiadomość, używamy jej, w przeciwnym razie domyślnie
            successContainer.appendChild(successContent);
            formContainer.appendChild(successContainer);

            console.log('Sukces:', data.message);

            // Przekierowanie po 5 sekundach
            setTimeout(() => {
                window.location.href = '/login';  // Przekierowanie do strony logowania po rejestracji
            }, 6000);
        })
        .catch(error => {
            console.error('Błąd:', error.message);
            formContainer.innerHTML = ''; // Czyszczenie poprzednich komunikatów

            // Komunikat o błędzie
            let errorContainer = document.createElement('div');
            errorContainer.classList.add('error');
            errorContainer.style.display = 'flex';
            errorContainer.style.padding = '10px';
            errorContainer.style.transition = '0.2s';
            errorContainer.style.justifyContent = 'center';
            errorContainer.style.backgroundColor = '#ff9b9b'; // Czerwony kolor
            errorContainer.style.borderRadius = '10px';

            let errorContent = document.createElement('h5');
            errorContent.textContent = 'Błąd rejestracji. Spróbuj ponownie';  // Ogólny komunikat błędu
            errorContainer.appendChild(errorContent);
            formContainer.appendChild(errorContainer);
        });
}