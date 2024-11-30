function checkLoginProtect() {
    fetch('http://localhost:3000/auth', {
        method: 'GET',
        credentials: 'include'  // Umożliwia przesyłanie ciasteczek
      })
      .then(response => response.json())
      .then(data => {
        if (data.loggedIn) {
            activeUserImg.src = data.user.img
            userImgData = data.user.img
        } else {
            window.location.href = '/login'
        }
      })
      .catch(error => console.error('Błąd:', error));
}
checkLoginProtect()
let userImageContainer = document.querySelectorAll('.settings-profile-content')[0];

const imageOptions = {
    1: '../img/pictures/awatar1.svg',
    2: '../img/pictures/awatar2.svg',
    3: '../img/pictures/awatar3.svg',
    4: '../img/pictures/awatar4.svg',
    5: '../img/pictures/awatar5.svg',
    6: '../img/pictures/awatar6.svg'
};

let activeUserImgContainer = document.createElement('div')
activeUserImgContainer.classList.add('settings-profile-content-upload')

let activeUserImg = document.createElement('img')
activeUserImg.classList.add('profileImg')

activeUserImgContainer.appendChild(activeUserImg)
userImageContainer.appendChild(activeUserImgContainer)

let userImageOptionsContainer = document.createElement('div')
userImageOptionsContainer.classList.add('settings-profile-image-options')

Object.values(imageOptions).forEach(imgSrc => {
    let userImageOption = document.createElement('div')
    userImageOption.classList.add('profile-image-option')

    userImageOption.addEventListener( 'click', function(){
        console.log('wybrane: ',imgSrc)
        activeUserImg.src = imgSrc

        fetch('http://localhost:3000/userImgChange', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_img: imgSrc,
            }),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json()
            })
            .then(data => {
                console.log('Sukces:', data)
                document.getElementById('userActiveImg').src = imgSrc
            })
            .catch(error => console.error('Błąd:', error))
    })

    let userImageOptionImg = document.createElement('img')
    userImageOptionImg.src = imgSrc;

    userImageOption.appendChild(userImageOptionImg);
    userImageOptionsContainer.appendChild(userImageOption)
});

userImageContainer.appendChild(userImageOptionsContainer)
