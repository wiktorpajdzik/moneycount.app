function checkLoginStatus() {
    fetch('http://localhost:3000/auth', {
        method: 'GET',
        credentials: 'include'  // Umożliwia przesyłanie ciasteczek
      })
      .then(response => response.json())
      .then(data => {
        if (data.loggedIn) {
            console.log('Zalogowany użytkownik:', data.user);

            let profileInfoElement = document.getElementById('profileInfo')

            let profileElement = document.createElement('div')
            profileElement.classList.add('menu-profile')

            let profileElementBorder = document.createElement('div')
            profileElementBorder.classList.add('menu-border')

            let profileOptions = document.createElement('div')
            profileOptions.classList.add('profile-options')

            let userFullName = data.user.name+' '+data.user.surname

            let userId = data.user.id
            let userN = data.user.name

            let userAssetsMessage = document.getElementById('user-name')
            if(userAssetsMessage){
                userAssetsMessage.innerHTML = "Cześć "+userN+", oto Twój majątek!"
            }

            let userName = document.createElement('h5')
            userName.textContent = userFullName

            let userInfo = document.createElement('div')
            userInfo.classList.add('profile-options-describe')

            let userFlag = document.createElement('img')
            userFlag.src = '../img/flags/poland-flag.png'

            let userFlagCode = document.createElement('h6')
            userFlagCode.textContent = data.user.currency

            let userImg = document.createElement('img')
            userImg.src = data.user.img
            userImg.id = 'userActiveImg'

            userImg.addEventListener( 'click', function(){
              window.location.href = '/panel'
            })

            let logoutButton = document.createElement('div')
            logoutButton.style.padding = '5px'
            logoutButton.style.display = 'flex'
            logoutButton.style.alignItems = 'center'
            logoutButton.style.cursor = 'pointer'
            logoutButton.style.backgroundColor = 'aliceblue'
            logoutButton.style.borderRadius = '5px'

            let logoutButtonText = document.createElement('h4')
            logoutButtonText.textContent = '🔓'

            logoutButton.appendChild(logoutButtonText)

            let settingsButton = document.createElement('div')
            settingsButton.style.padding = '5px'
            settingsButton.style.display = 'flex'
            settingsButton.style.alignItems = 'center'
            settingsButton.style.cursor = 'pointer'
            settingsButton.style.backgroundColor = 'aliceblue'
            settingsButton.style.borderRadius = '5px'

            let settingsButtonText = document.createElement('h4')
            settingsButtonText.textContent = '⚙️'

            settingsButton.appendChild(settingsButtonText)

            settingsButton.addEventListener( 'click', function(){
                window.location.href = '/settings'
            })

            logoutButton.addEventListener( 'click', function(){
                console.log('Wylogowywanie...');
                // Wyślij żądanie do backendu

                let errorContainer = document.createElement('div')
                errorContainer.classList.add('error')
                errorContainer.style.display = 'flex'
                errorContainer.style.padding = '10px'
                errorContainer.style.transition = '0.2s'
                errorContainer.style.justifyContent = 'center'
                errorContainer.style.backgroundColor = '#9bffa2'
                errorContainer.style.fontFamily = 'Funnel Display'

                let errorContent = document.createElement('h5')
                errorContent.textContent = 'Pomyślnie wylogowano z konta!'

                errorContainer.appendChild(errorContent)
                document.querySelectorAll('main')[0].childNodes[0].before(errorContainer)

                fetch('http://localhost:3000/logout', { method: 'GET' })
                .then(response => {
                    if (response.ok) {
                    console.log('Wylogowano pomyślnie');
                    // Po wylogowaniu przekieruj na stronę logowania
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                    } else {
                    console.error('Błąd podczas wylogowywania');
                    alert('Nie udało się wylogować');
                    }
                })
                .catch(error => {
                    console.error('Błąd połączenia z serwerem:', error);
                    alert('Błąd połączenia z serwerem');
                });
            })

            userInfo.appendChild(userFlag)
            userInfo.appendChild(userFlagCode)
            profileOptions.appendChild(userName)
            profileOptions.appendChild(userInfo)
            profileElementBorder.appendChild(profileOptions)
            profileElementBorder.appendChild(userImg)
            profileElement.appendChild(profileElementBorder)
            profileInfoElement.appendChild(profileElement)
            profileInfoElement.appendChild(logoutButton)
            profileInfoElement.appendChild(settingsButton)

        } else {
            // NIE ZALOGOWANY
            console.log('nie zalogowany')

            let profileInfoElement = document.getElementById('profileInfo')
            let menuRight = document.createElement('div')
            menuRight.classList.add('menu-right')
            menuRight.id = 'logoutButton'
            menuRight.addEventListener( 'click', function(){
              window.location.href = '/login'
            })
            let menuRightText = document.createElement('h4')
            menuRightText.textContent = 'Zaloguj się 🔒'

            menuRight.appendChild(menuRightText)
            profileInfoElement.appendChild(menuRight)

        }
      })
      .catch(error => console.error('Błąd:', error));
}

document.addEventListener('DOMContentLoaded', () => {
    checkLoginStatus();
});

// Wybieramy element, w którym chcemy osadzić stopkę (np. body)
const body = document.querySelector('body');

// Tworzymy stopkę
const footer = document.createElement('footer');

// Tworzymy główny kontener stopki
const footerDiv = document.createElement('div');

// Dodajemy logo
const logoImg = document.createElement('img');
logoImg.src = '../img/logos/wprojects_logo.png';
logoImg.alt = '';

// Tworzymy listę elementów stopki
const footerList = document.createElement('ul');

// Dodajemy poszczególne elementy listy
const items = [
    '© 2024 Money Count',
    'Wersja 1.0.0',
];

items.forEach(itemText => {
    const listItem = document.createElement('li');
    listItem.textContent = itemText;
    footerList.appendChild(listItem);
});

// Składamy wszystko razem
footerDiv.appendChild(logoImg);
footerDiv.appendChild(footerList);
footer.appendChild(footerDiv);

// Dodajemy stopkę do dokumentu
body.appendChild(footer);

let menuNav = document.querySelectorAll('.navItem')
menuNav[0].addEventListener( 'click', function(){
    window.location.href = '/'
})
menuNav[1].addEventListener( 'click', function(){
    window.location.href = '/solutions'
})
menuNav[2].addEventListener( 'click', function(){
    window.location.href = '/money'
})

let menuLogo = document.querySelectorAll('.menu-logo')[0]
if(menuLogo){
    menuLogo.addEventListener( 'click', function(){
        window.location.href = '/';
    })
}
