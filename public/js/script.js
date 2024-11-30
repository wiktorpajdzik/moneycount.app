function checkLoginProtect() {
    fetch('http://localhost:3000/auth', {
        method: 'GET',
        credentials: 'include'  // Umożliwia przesyłanie ciasteczek
      })
      .then(response => response.json())
      .then(data => {
        if (data.loggedIn) {
        } else {
            window.location.href = '/login'
        }
      })
      .catch(error => console.error('Błąd:', error));
}
checkLoginProtect()
let tempCurrencies = []
let moneyCurrency = {
    PLN: {
        name: "Polski Złoty",
        shortcut: "PLN",
        sign: "zł",
        lstring: "pl-PL",
        language: "PL",
        price: 1
    },
};
let defaultLanguage = moneyCurrency.PLN.language;
let basicCurrency = moneyCurrency.PLN;
let userAllMoney = 0;
let allMoney = 0;
let chartInstance;
let groupChart;

let totalAmmount = document.getElementById("total-ammount")
let userName = document.getElementById("user-name")

let cryptoList = [] // przechowuje dane o kryptowalutach
let userAssets = [] // przechowuje aktywa użytkownika
let possibleAssets = [] //przechowuje wszystkie możliwe typy assetów w tym nazwy kryptowalut
let assetInfoList = [] //przechowuje informacje dla wykresu, najważniejsze o aktualnej wartości, uproszczone dane

// Funkcja do pobierania danych o kryptowalutach
async function fetchCryptoPrices() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=pln&order=market_cap_desc&per_page=100&page=1&sparkline=false');
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();
        cryptoList = data;
        data.forEach( crypto => {
            possibleAssets.push(crypto)

            if(possibleAssets.length == 5){
                livePrices(possibleAssets)
            }

        })
    } catch (error) {
        console.error('Błąd:', error);
    }
}
// Funkcja do ładowania danych z lokalnego serwera
let mainContainer = document.getElementById("container-values")

function loadData() {
    mainContainer.innerHTML = ''
    possibleAssets = []
    assetInfoList = []
    userAllMoney = 0
    fetch('http://localhost:3000/assets')
        .then(response => {
            if (!response.ok) {
                tempContainer = document.createElement('div')
                tempContainer.classList.add('container-values-section-el')
                tempContainer.style = "justify-content: center;"
                tempContainer.addEventListener( 'click', () => addAsset(mainContainer))

                let tempContainerPlus = document.createElement('a')
                tempContainerPlus.classList.add('container-value-el-plus')
                tempContainerPlus.innerText = "➕"
                tempContainer.appendChild(tempContainerPlus)
                mainContainer.appendChild(tempContainer)
                console.log('brak aktywnych assetów')
            }
            userAllMoneyCounter()
            return response.json();
        })
        .then(data => {
            data.forEach(item => {
                userAssets.push(item)
                let tempPrice
                let imageElement
                let tempAssetElement = {
                    id: item.asset_id,
                    title: item.title,
                    value: null,
                    category: null,
                    firstPrice: null,
                    ammount: item.ammount,
                    cryptoPrice: null,
                    tempPrice: null,
                    symbol: null,
                }
                let leftProcent = document.createElement('h6');
                // leftProcent.classList.add('container-values-title-id');
                if (item.category_id === 4) {
                    // Dla kryptowaluty
                    const matchedCrypto = cryptoList.find(crypto => crypto.id.toLowerCase() === item.title.toLowerCase());
                    if (matchedCrypto) {
                        tempPrice = item.ammount * matchedCrypto.current_price;
                        // userAllMoney += tempPrice;
                        imageElement = matchedCrypto.image; // Pobieramy obrazek z kryptowaluty

                        tempAssetElement.category = 4
                        tempAssetElement.firstPrice = tempPrice
                        tempAssetElement.ammount = Number(item.ammount)
                        tempAssetElement.cryptoPrice = matchedCrypto.current_price
                        tempAssetElement.tempPrice = item.ammount * matchedCrypto.current_price
                        tempAssetElement.symbol = matchedCrypto.symbol
                        if(matchedCrypto.price_change_percentage_24h < 0){
                            leftProcent.textContent = matchedCrypto.price_change_percentage_24h.toFixed(2)+'%'
                            leftProcent.style = 'color: red'
                        }
                        else if(matchedCrypto.price_change_percentage_24h > 0){
                            leftProcent.textContent = '+'+matchedCrypto.price_change_percentage_24h.toFixed(2)+'%'
                            leftProcent.style = 'color: green'
                        }
                        else if(matchedCrypto.price_change_percentage_24h == 0){
                            leftProcent.textContent = matchedCrypto.price_change_percentage_24h.toFixed(2)+'%'
                            leftProcent.style = 'color: grey'
                        }

                    } else {
                        console.log(`Chwilowy błąd Crypto API: ${item.title}`);
                        return; // Zatrzymujemy dalsze przetwarzanie w przypadku błędu
                    }
                }
                else if(item.category_id === 3){
                    const matchedCurrency = tempCurrencies.find(currency => currency.code === item.title);
                    if (matchedCurrency) {
                        tempPrice = item.ammount * matchedCurrency.rate;
                        imageElement = matchedCurrency.flag; // Pobieramy obrazek z kryptowaluty
                        tempAssetElement.category = 3
                        tempAssetElement.firstPrice = tempPrice
                        tempAssetElement.ammount = Number(item.ammount)
                        tempAssetElement.tempPrice = item.ammount * matchedCurrency.rate
                        tempAssetElement.symbol = matchedCurrency.code
                        leftProcent.textContent = matchedCurrency.percentage_change
                        if(matchedCurrency.percentage_change < 0){
                            leftProcent.textContent = matchedCurrency.percentage_change.toFixed(2)+'%'
                            leftProcent.style = 'color: red'
                        }
                        else if(matchedCurrency.percentage_change > 0){
                            leftProcent.textContent = '+'+matchedCurrency.percentage_change.toFixed(2)+'%'
                            leftProcent.style = 'color: green'
                        }
                        else if(matchedCurrency.percentage_change == 0){
                            leftProcent.textContent = matchedCurrency.percentage_change.toFixed(2)+'%'
                            leftProcent.style = 'color: grey'
                        }
                    } else {
                        console.log(`Chwilowy błąd walut API: ${item.title}`);
                    }
                }
                else if(item.category_id === 1) {
                    // Dla zwykłego aktywa
                    tempPrice = item.value;
                    tempAssetElement.category = 1
                    tempAssetElement.firstPrice = tempPrice
                    tempAssetElement.tempPrice = item.value
                    tempAssetElement.value = item.value
                }
                userAllMoney += tempPrice

                assetInfoList.push(tempAssetElement)

                // Tworzenie elementu aktywa (wspólna część kodu)
                let container = document.createElement('div');
                container.classList.add('container-values-section-el');
                container.id = item.asset_id;

                // Lewa strona - Tytuł aktywa
                let leftContainer = document.createElement('div');
                leftContainer.style.alignItems = 'center';
                let leftAmount = document.createElement('div');
                leftAmount.classList.add('container-values-section-el-ammount-left');
                let leftTitle = document.createElement('h5');
                leftTitle.classList.add('container-values-title-id');
                leftTitle.textContent = item.title;
                leftAmount.appendChild(leftTitle);
                leftAmount.appendChild(leftProcent);

                let img = document.createElement('img');
                if(imageElement){
                    img.src = imageElement;
                    img.style.height = 'auto';
                    img.style.width = '30px';
                    img.style.display = 'flex'
                }
                else{
                    img.style.display = 'none'
                }
                leftContainer.appendChild(img);
                leftContainer.appendChild(leftAmount);

                // Prawa strona - Wartości aktywa
                let rightContainer = document.createElement('div');
                rightContainer.classList.add('container-values-section-el-ammount-right');

                let rightAmount = document.createElement('h5');
                rightAmount.textContent = (tempPrice * basicCurrency.price)
                    .toLocaleString(basicCurrency['lstring'], { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " " + basicCurrency.shortcut;

                // Subwartość aktywa (ilość)
                let rightSubAmount = document.createElement('h6');
                rightSubAmount.style.textTransform = 'uppercase'
                if(item.ammount){
                    rightSubAmount.textContent = item.ammount+' '+tempAssetElement.symbol
                }
                else{
                    rightSubAmount.textContent = '';
                }

                let rightSubContainer = document.createElement('div');
                rightSubContainer.style = "display: flex; flex-direction: column; text-align: right;";
                rightSubContainer.appendChild(rightAmount);
                rightSubContainer.appendChild(rightSubAmount);

                // Przyciski edycji i usuwania
                let rightLeftSubContainer = document.createElement('div');
                rightLeftSubContainer.classList.add("container-values-section-el-ammount-right-button");

                let rightLeftEdit = document.createElement('a')
                rightLeftEdit.textContent = '✏️'
                rightLeftEdit.id = item.asset_id
                rightLeftEdit.classList.add('toEdit')
                rightLeftEdit.addEventListener( 'click', () => editAsset(item))
                let rightLeftDelete = document.createElement('a')
                rightLeftDelete.textContent = '❌'
                rightLeftDelete.addEventListener( 'click', () => deleteAsset(item))

                rightLeftSubContainer.appendChild(rightLeftEdit);
                rightLeftSubContainer.appendChild(rightLeftDelete);

                // Dodawanie elementów do kontenera
                rightContainer.appendChild(rightSubContainer);
                rightContainer.appendChild(rightLeftSubContainer);

                // Dodajemy kontenery do głównego kontenera
                container.appendChild(leftContainer);
                container.appendChild(rightContainer);

                // Dodajemy kontener do głównej sekcji na stronie
                mainContainer.appendChild(container);
            });

            tempContainer = document.createElement('div')
            tempContainer.classList.add('container-values-section-el')
            tempContainer.style = "justify-content: center;"
            tempContainer.addEventListener( 'click', () => addAsset(mainContainer))

            let tempContainerPlus = document.createElement('a')
            tempContainerPlus.classList.add('container-value-el-plus')
            tempContainerPlus.innerText = "➕"
            tempContainer.appendChild(tempContainerPlus)
            mainContainer.appendChild(tempContainer)

            userAllMoneyCounter()
        });
}
function userAllMoneyCounter() {

    // Oblicz wartość całkowitą
    allMoney = userAllMoney * basicCurrency.price;

    // Aktualizacja interfejsu użytkownika
    totalAmmount.innerHTML = '💸 '+parseFloat(allMoney.toFixed(2))
        .toLocaleString(basicCurrency['lstring']) + " " + basicCurrency.shortcut;

    // Pobierz kontekst dla wykresu
    const ctx = document.getElementById('simpleChart');

    // Przygotowanie danych dla wykresu
    const labels = [];
    const data = [];

    assetInfoList.forEach(asset => {
        labels.push(asset.title)
        data.push(asset.tempPrice)
    })

    // Usuń istniejący wykres, jeśli istnieje
    if (chartInstance) {
        chartInstance.destroy();
    }

    if (groupChart){
        groupChart.destroy();
    }

    // Stwórz nowy wykres
    chartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels, // Dynamiczne etykiety
            datasets: [{
                label: 'Wartość aktywa w zł',
                data: data, // Dynamiczne dane
                borderWidth: 1
            }]
        },
        options: {
            plugins: {
                legend: {
                    display: true
                }
            }
        }
    });

    const ctz = document.getElementById('groupChart');
    let groupChartNames = [];
    let categorySums = {}; // Mapa do przechowywania sum wartości

    // Najpierw pobieramy nazwy kategorii i ich ID z userAssets
    userAssets.forEach(asset => {
        const categoryName = asset.category_name;
        const categoryId = asset.category_id;

        // Dodaj nazwę kategorii do tablicy w odpowiedniej kolejności
        if (!groupChartNames.includes(categoryName)) {
            groupChartNames.push(categoryName);
        }

        // Inicjalizujemy wartość sumy dla tego ID jako 0
        if (!categorySums[categoryId]) {
            categorySums[categoryId] = 0;
        }
    });

    assetInfoList.forEach(info => {
        const categoryId = info.category
        const tempPrice = parseFloat(info.tempPrice) || 0

        if (categorySums[categoryId] !== undefined) {
            categorySums[categoryId] += tempPrice;
        }
    });

    const groupChartValues = groupChartNames.map(name => {
        const categoryId = userAssets.find(asset => asset.category_name === name)?.category_id;
        return categorySums[categoryId] || 0;
    });

        groupChart = new Chart(ctz, {
            type: 'doughnut',
            data: {
                labels: groupChartNames, // Dynamiczne etykiety
                datasets: [{
                    label: 'Wartość kategori w zł',
                    data: groupChartValues, // Dynamiczne dane
                    borderWidth: 1
                }]
            },
            options: {
                plugins: {
                    legend: {
                        display: true,
                    }
                }
            }
        });

}
function addAsset(a){
    let nextAssetIndex
    async function getNextIndex() {
        try {
            const response = await fetch('http://localhost:3000/next-index')
            if (!response.ok) {
                throw new Error(`Błąd serwera: ${response.status}`)
            }

            const data = await response.json()
            nextAssetIndex = data.nextIndex
            console.log("Następny indeks to:", nextAssetIndex)
        } catch (error) {
            console.error("Błąd podczas pobierania następnego indeksu:", error)
        }
    }
    getNextIndex();

    tempNewAssetInfo = {
        asset_id: null,
        title: null,
        ammount: null,
        value: null,
        category_id: null,
        cryptoPrice: null,
        tempPrice: null
    }

    let lastElementIndex = a.childElementCount-1
    let lastElement = a.childNodes[lastElementIndex]

    let tempNewAsset = document.createElement('div')
    tempNewAsset.classList.add('container-values-section-el')

    let tempNewLeftContainer = document.createElement('div')
    tempNewLeftContainer.style = "align-items: center;"

    let tempNewInput = document.createElement('input')
    tempNewInput.classList.add('asset-edit-input')
    tempNewInput.placeholder = 'Nazwa aktywa'
    tempNewInput.type = 'input'

    let tempNewInputImg = document.createElement('img')
    tempNewInputImg.style = 'display: none'

    tempNewLeftContainer.appendChild(tempNewInputImg)
    tempNewLeftContainer.appendChild(tempNewInput)

    tempNewInput.addEventListener( 'input', function(){
        matchAsset(tempNewInput.value)
    })

    function matchAsset(title){
        cryptoList.some(crypto => {
            if (crypto.id === title || crypto.symbol === title) {
                console.log(crypto)
                tempNewInput.value = crypto.id
                tempNewInputImg.src = crypto.image
                tempNewInputImg.style = 'display: flex; height: auto; width: 30px'
                tempNewInput.classList.add('crypto')

                tempNewAssetInfo.category_id = 4
                tempNewAssetInfo.cryptoPrice = crypto.current_price
                tempNewAssetInfo.tempPrice = crypto.current_price

                return true;
            }

            tempNewInputImg.src = ''
            tempNewInputImg.style = 'display: none'
            valueEditInput.classList.add('asset')
            tempNewAssetInfo.category_id = 1
            tempNewAssetInfo.cryptoPrice = 0

            return false;
        })
        tempCurrencies.some(currency => {
            if(currency.code.toLowerCase() === title.toLowerCase()){
                console.log(currency)

                tempNewInput.value = currency.code
                tempNewInputImg.src = currency.flag
                tempNewInputImg.style = 'display: flex; height: auto; width: 30px;'
                tempNewInput.classList.add('currency')

                tempNewAssetInfo.category_id = 3
                tempNewAssetInfo.cryptoPrice = 0
            }
        });

    }

    let tempNewRightContainer = document.createElement('div')
    tempNewRightContainer.classList.add('container-values-section-el-ammount-right')

    let valueEditInput = document.createElement('input')
    valueEditInput.classList.add('asset-edit-input')
    valueEditInput.type = 'number'
    valueEditInput.placeholder = 'Wartość'

    let tempButtonsContainer = document.createElement('div')
    tempButtonsContainer.classList.add('container-values-section-el-ammount-right-button')

    // DODAĆ ONCLICKI

    let rightEdit = document.createElement('a')
    rightEdit.textContent = '✅'
    rightEdit.classList.add('toConfirm')
    rightEdit.addEventListener( 'click', () => editAsset(tempNewAssetInfo))

    getNextIndex().then(() => {
        rightEdit.id = nextAssetIndex
        tempNewAsset.id = nextAssetIndex
        tempNewAssetInfo.asset_id = nextAssetIndex
    }).catch(error => {
        console.error("Nie udało się pobrać indeksu:", error);
    });

    let rightDelete = document.createElement('a')
    rightDelete.textContent = '❌'
    rightDelete.addEventListener( 'click', function(){
        tempNewAsset.remove()
    })

    //
    tempButtonsContainer.appendChild(rightEdit);
    tempButtonsContainer.appendChild(rightDelete);

    tempNewRightContainer.appendChild(valueEditInput)
    tempNewRightContainer.appendChild(tempButtonsContainer)


    tempNewAsset.append(tempNewLeftContainer)
    tempNewAsset.append(tempNewRightContainer)

    lastElement.before(tempNewAsset)
}
function deleteAsset(asset){
    console.log('do usunięcia: ',asset)

    fetch('http://localhost:3000/delete-element', {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: asset.asset_id }),
        })
        .then(response => response.text())
        .then(data => {
            console.log(data);
            if (data === 'Element został usunięty') {
                loadData()
            }
        })
        .catch(error => {
            console.error('Błąd:', error);
            alert('Błąd podczas usuwania elementu')
        }
    )
}
function editButton(icon, klasa, asset, editedButton){
    let rightLeftEdit = document.createElement('a')
    rightLeftEdit.textContent = icon
    rightLeftEdit.id = asset.asset_id
    rightLeftEdit.classList.add(klasa)
    rightLeftEdit.addEventListener( 'click', () => editAsset(asset))
    editedButton.replaceWith(rightLeftEdit)
}
function editAsset(asset){
    let editedAsset = document.getElementById(asset.asset_id)
    let editedButton = editedAsset.childNodes[1].childNodes[1].childNodes[0]

    if (editedAsset.childNodes[1].childNodes[1].childNodes[0].classList.contains('toEdit')) {

        let titleEditInput = document.createElement('input')
        titleEditInput.classList.add('asset-edit-input')
        titleEditInput.value = asset.title
        titleEditInput.placeholder = 'Nazwa aktywa'

        let imgEditElement = document.createElement('img')
        imgEditElement.style = 'display: none'

        let editLeftContainer = document.createElement('div')
        editLeftContainer.style = 'align-items: center'

        editLeftContainer.appendChild(imgEditElement)
        editLeftContainer.appendChild(titleEditInput)

        // DODANIE INPUTU DO WARTOŚCI, jeden AMMOUNT drugi PRICE

        let valueEditInput = document.createElement('input')
        valueEditInput.classList.add('asset-edit-input')
        valueEditInput.type = 'number'
        valueEditInput.placeholder = 'Wartość'

        let oldPriceElement = editedAsset.childNodes[1].childNodes[0]

        let oldAmmount = editedAsset.childNodes[1].childNodes[0].childNodes[1].textContent
        oldAmmount = oldAmmount.split(' ')[0]
        oldAmmount = Number(oldAmmount.replace(/\s+/g, '').replace(',', '.')) //goła liczba po konwersji

        let oldPrice = editedAsset.childNodes[1].childNodes[0].childNodes[0].textContent
        oldPrice = oldPrice.split(' ')[0]
        oldPrice = Number(oldPrice.replace(/\s+/g, '').replace(',', '.')) //goła liczba po konwersji

        if(!oldAmmount){
            valueEditInput.value = oldPrice
            oldPriceElement.replaceWith(valueEditInput)
        }
        else{
            valueEditInput.value = oldAmmount
            console.log(oldAmmount)
            oldPriceElement.replaceWith(valueEditInput)
        }

        //
        console.log('do edycji')
        editButton('✅','toConfirm',asset, editedButton)

        // DODANIE INPUTU
        editedAsset.childNodes[0].replaceWith(editLeftContainer)

        titleEditInput.addEventListener( 'input', function(){
            matchAsset(titleEditInput.value)
        })
        function matchAsset(title) {
            // 1. Spróbuj dopasować do kryptowaluty
            const matchedCrypto = cryptoList.find(crypto => crypto.id === title || crypto.symbol === title);

            if (matchedCrypto) {
                // Aktualizacja elementów dla kryptowaluty
                titleEditInput.value = matchedCrypto.id;
                imgEditElement.src = matchedCrypto.image;
                imgEditElement.style.display = 'flex';
                imgEditElement.style.height = '20px';
                imgEditElement.style.width = 'auto';
                valueEditInput.classList.add('crypto');

                const matchingElement = assetInfoList.find(item => item.id === asset.asset_id);

                if (matchingElement) {
                    matchingElement.tempPrice = matchedCrypto.current_price * matchingElement.ammount;
                    matchingElement.cryptoPrice = matchedCrypto.current_price;
                    matchingElement.category = 4; // Kategoria kryptowalut
                }

                return true; // Zwróć wynik, jeśli znaleziono kryptowalutę
            }

            const matchedCurrency = tempCurrencies.find(currency => currency.code.toLowerCase() === title.toLowerCase());

            if (matchedCurrency) {
                tempNewInput.value = matchedCurrency.code;
                tempNewInputImg.src = matchedCurrency.flag;
                tempNewInputImg.style.display = 'flex';
                tempNewInputImg.style.height = '20px';
                tempNewInputImg.style.width = 'auto';
                tempNewInput.classList.add('currency');

                tempNewAssetInfo.category_id = 3; // Kategoria walut
                tempNewAssetInfo.cryptoPrice = 0;

                return true; // Zwróć wynik, jeśli znaleziono walutę
            }

            // 3. Jeśli brak dopasowania, ustaw domyślne wartości
            imgEditElement.src = '';
            imgEditElement.style.display = 'none';
            valueEditInput.classList.add('asset');

            const defaultElement = assetInfoList.find(item => item.id === asset.asset_id);
            if (defaultElement) {
                defaultElement.category = 1; // Kategoria zwykłych aktywów
                defaultElement.cryptoPrice = 0;
                defaultElement.tempPrice = defaultElement.price;
            }

            return false; // Zwróć wynik, jeśli nic nie znaleziono
        }

    }
    else{

        if(editedAsset.childNodes[0].childNodes[1].value == '' || editedAsset.childNodes[0].childNodes[1].value == null)
        {
            console.log('error')
        }
        else{
            let titleEditElement = document.createElement('h5')
            titleEditElement.classList.add('container-values-title-id')
            titleEditElement.textContent = editedAsset.childNodes[0].childNodes[1].value

            let newTitle = editedAsset.childNodes[0].childNodes[1].value
            newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1)
            let newValue = Number(editedAsset.childNodes[1].childNodes[0].value)

            let titleEditElementCont = document.createElement('div')
            titleEditElementCont.classList.add('container-values-section-el-ammount-left')

            titleEditElementCont.appendChild(titleEditElement)

            let imgEditElement = document.createElement('img')
            imgEditElement.style = 'display: none'

            let editLeftContainer = document.createElement('div')
            editLeftContainer.style = 'align-items: center'

            editLeftContainer.appendChild(imgEditElement)
            editLeftContainer.appendChild(titleEditElementCont)

            editedAsset.childNodes[0].replaceWith(editLeftContainer)

            // ZAPIS DO BAZY DANYCH
            console.log('do zapisu')

            const matchingElement = assetInfoList.find(item => item.id === asset.asset_id);
            if (matchingElement) {
                console.log("Znaleziony element:", matchingElement);
                // EDYTUJ ELEMENT
                if(matchingElement.category == 4){
                    console.log('Nowa cena krypto: ',newValue)
                    matchingElement.value = null
                    matchingElement.ammount = newValue
                }
                else if(matchingElement.category == 3){
                    console.log('Nowa cena waluty: ',newValue)
                    matchingElement.value = null
                    matchingElement.ammount = newValue
                }
                else{
                    console.log('Nowa cena asset: ',newValue)
                    matchingElement.value = newValue
                    matchingElement.ammount = null
                    matchingElement.category = 1
                }

                fetch('http://localhost:3000/edit-asset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(
                        {
                            title: newTitle,
                            category: matchingElement.category,
                            price: matchingElement.value,
                            ammount: matchingElement.ammount,
                            id: matchingElement.id
                        }),
                    })
                    .then(response => response.text())
                    .then(data => {
                        // POWODZENIE
                        loadData();
                    })
                    .catch(error => {
                        console.error('Błąd:', error);
                        alert('Błąd podczas edytowania elementu')
                    }
                )
                editButton('✏️','toEdit',asset, editedButton)


            } else {
                // DODAJ ELEMENT
                console.log('dodaję element',newTitle, newValue)
                newTitle = newTitle.charAt(0).toUpperCase() + newTitle.slice(1)
                asset.title = newTitle

                if(asset.category_id == 4){
                    asset.ammount = newValue
                }
                if(asset.category_id == 3){
                    asset.ammount = newValue
                }
                else{
                    asset.value = newValue
                }
                console.log(asset)
                fetch('http://localhost:3000/add-asset', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: asset.title,
                        category_id: asset.category_id,
                        value: asset.value !== "" ? asset.value : null,
                        ammount: asset.ammount !== "" ? asset.ammount : null,
                    }),
                    })
                    .then(response => response.text())
                    .then(data => {
                        // POWODZENIE
                        loadData();
                    })
                    .catch(error => {
                        console.error('Błąd:', error);
                        alert('Błąd podczas edytowania elementu')
                    }
                )
                editButton('✏️','toEdit',asset, editedButton)

            }
        }
    }
}
function livePrices(a){
    a.forEach( item => {
        let livePricesContainer = document.getElementById('livePrices')

        let livePriceItem = document.createElement('div')
        livePriceItem.classList.add('container-left-item')

        let livePriceLeft = document.createElement('div')
        livePriceLeft.style = 'display: flex; gap: 10px; align-items: center;'

        let livePriceTempCont = document.createElement('div')
        livePriceTempCont.style = 'gap: 5px'

        let livePriceChange = document.createElement('h6')

        if(item.price_change_percentage_24h < 0){
            livePriceChange.textContent = item.price_change_percentage_24h.toFixed(2)+'%'
            livePriceChange.style = 'color: red; font-weight: 400;'
        }
        else if(item.price_change_percentage_24h > 0){
            livePriceChange.textContent = '+'+item.price_change_percentage_24h.toFixed(2)+'%'
            livePriceChange.style = 'color: green; font-weight: 400;'
        }
        else if(item.price_change_percentage_24h == 0){
            livePriceChange.textContent = item.price_change_percentage_24h.toFixed(2)+'%'
            livePriceChange.style = 'color: grey; font-weight: 400;'
        }


        let livePriceName = document.createElement('h5')
        modPriceName = item.id[0].toUpperCase() + item.id.slice(1);

        livePriceName.textContent = modPriceName

        let livePriceImg = document.createElement('img')
        livePriceImg.src = item.image
        livePriceImg.style = 'width: 20px'

        livePriceTempCont.appendChild(livePriceName)
        livePriceTempCont.appendChild(livePriceChange)
        livePriceLeft.appendChild(livePriceImg)
        livePriceLeft.appendChild(livePriceTempCont)

        let livePriceRight = document.createElement('div')

        let livePrice = document.createElement('h5')
        livePrice.textContent = item.current_price.toLocaleString(basicCurrency['lstring'])+' '+basicCurrency.shortcut

        livePriceRight.appendChild(livePrice)

        livePriceItem.appendChild(livePriceLeft)
        livePriceItem.appendChild(livePriceRight)
        livePricesContainer.appendChild(livePriceItem)
    })

}
async function fetchAndUpdateTempCurrencies() {
    const currencies = [
        { code: 'USD', flag: 'https://flagcdn.com/w40/us.png' },
        { code: 'EUR', flag: 'https://flagcdn.com/w40/eu.png' },
        { code: 'GBP', flag: 'https://flagcdn.com/w40/gb.png' },
    ];

    try {
        const promises = currencies.map(currency =>
            fetch(`https://api.nbp.pl/api/exchangerates/rates/a/${currency.code}/last/2/?format=json`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Error fetching ${currency.code}: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => ({
                    code: currency.code,
                    flag: currency.flag,
                    rates: data.rates,
                }))
        );

        const rates = await Promise.all(promises);

        // Zaktualizuj tablicę tempCurrencies
        tempCurrencies = rates.map(({ code, flag, rates }) => {
            const todayRate = rates[1].mid;
            const yesterdayRate = rates[0].mid;

            const changePercent = ((todayRate - yesterdayRate) / yesterdayRate) * 100;

            return {
                code,
                flag,
                rate: todayRate,
                percentage_change: changePercent,
            };
        });

    } catch (error) {
        console.error('Error fetching exchange rates:', error);
        tempCurrencies = []; // W przypadku błędu, ustawiamy tempCurrencies na pustą tablicę
    }
}
function generateCurrencyElements() {
    const livePricesContainer = document.getElementById('liveCurrency');

    tempCurrencies.forEach(({ code, flag, rate, percentage_change }) => {
        const livePriceItem = document.createElement('div');
        livePriceItem.classList.add('container-left-item');

        const livePriceLeft = document.createElement('div');
        livePriceLeft.style = 'display: flex; gap: 10px; align-items: center;';

        const livePriceTempCont = document.createElement('div');
        livePriceTempCont.style = 'gap: 5px';

        const livePriceChange = document.createElement('h6');
        if (percentage_change < 0) {
            livePriceChange.textContent = percentage_change.toFixed(2) + '%';
            livePriceChange.style = 'color: red; font-weight: 400;';
        } else if (percentage_change > 0) {
            livePriceChange.textContent = '+' + percentage_change.toFixed(2) + '%';
            livePriceChange.style = 'color: green; font-weight: 400;';
        } else {
            livePriceChange.textContent = percentage_change.toFixed(2) + '%';
            livePriceChange.style = 'color: grey; font-weight: 400;';
        }

        const livePriceName = document.createElement('h5');
        livePriceName.textContent = code;

        const livePriceImg = document.createElement('img');
        livePriceImg.src = flag;
        livePriceImg.style = 'width: 20px';

        livePriceTempCont.appendChild(livePriceName);
        livePriceTempCont.appendChild(livePriceChange);
        livePriceLeft.appendChild(livePriceImg);
        livePriceLeft.appendChild(livePriceTempCont);

        const livePriceRight = document.createElement('div');

        const livePrice = document.createElement('h5');
        const tempCurrency = rate.toFixed(2).replace('.', ',');

        livePrice.textContent = tempCurrency + ' PLN';

        livePriceRight.appendChild(livePrice);

        livePriceItem.appendChild(livePriceLeft);
        livePriceItem.appendChild(livePriceRight);
        livePricesContainer.appendChild(livePriceItem);
    });
}
async function initializeApp() {
    // Pobieramy i aktualizujemy tablicę tempCurrencies
    await fetchAndUpdateTempCurrencies();
    // Generujemy elementy DOM na podstawie zaktualizowanej tablicy tempCurrencies
    generateCurrencyElements();
}
initializeApp();
async function main() {
    await fetchCryptoPrices()
    await fetchAndUpdateTempCurrencies();
    loadData();
}
main();