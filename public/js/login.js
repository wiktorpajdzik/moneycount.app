let formButton = document.querySelectorAll('.login-form-button')[0]
formButton.addEventListener( 'click', userLogin)
function userLogin() {
    let userEmail = document.getElementById('userEmail').value;
    let userPassword = document.getElementById('userPassword').value;
    let formContainer = document.querySelectorAll('.form-info')[0]
    formContainer.style.transition = '0.2s'

    fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email: userEmail,
            password: userPassword,
        }),
    })
        .then(response => {
            if (!response.ok) {
                throw new Error('Nie udało się zalogować: ' + response.status)
            }
            return response.json();
        })
        .then(data => {
            formContainer.innerHTML = ''
            let errorContainer = document.createElement('div')
            errorContainer.classList.add('success')
            errorContainer.style.display = 'flex'
            errorContainer.style.padding = '10px'
            errorContainer.style.transition = '0.2s'
            errorContainer.style.justifyContent = 'center'
            errorContainer.style.backgroundColor = '#9bffa2'
            errorContainer.style.borderRadius = '10px'

            let errorContent = document.createElement('h5')
            errorContent.textContent = 'Zalogowano pomyślnie'

            errorContainer.appendChild(errorContent)
            formContainer.appendChild(errorContainer)
            console.log('Sukces:', data.message);

           setTimeout(() => {
                window.location.href = '/panel'
            }, 2000)
        })
        .catch(error => {
            console.error('Błąd:', error.message)
            formContainer.innerHTML = ''
            let errorContainer = document.createElement('div')
            errorContainer.classList.add('error')
            errorContainer.style.display = 'flex'
            errorContainer.style.padding = '10px'
            errorContainer.style.transition = '0.2s'
            errorContainer.style.justifyContent = 'center'
            errorContainer.style.backgroundColor = '#ff9b9b'
            errorContainer.style.borderRadius = '10px'

            let errorContent = document.createElement('h5')
            errorContent.textContent = 'Nieprawidłowy login lub hasło'

            errorContainer.appendChild(errorContent)
            formContainer.appendChild(errorContainer)

        });
}
