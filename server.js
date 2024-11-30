const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const session = require('express-session');
const cookieParser = require('cookie-parser');
const nodemailer = require('nodemailer');
const crypto = require('crypto');


// Używanie cookie-parser i CORS
app.use(cookieParser());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

const db = mysql.createConnection({
  host: process.env.dbHost,
  user: process.env.dbUser,
  password: process.env.dbPass,
  database: process.env.dbName
});

// Sprawdzenie połączenia z bazą danych
db.connect((err) => {
  if (err) {
    console.error('Błąd połączenia z bazą danych:', err);
    return;
  }
  console.log('Połączono z bazą danych MySQL!');
});

const path = require('path');
// Serwowanie plików statycznych z folderu public
app.use(express.static(path.join(__dirname, 'public')));

// Trasa dla strony głównej (index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'front.html'));
});

app.get('/panel', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Trasa dla strony logowania (login.html)
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/settings', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'settings.html'));
});

app.get('/solutions', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'solutions.html'));
});

app.get('/money', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'money.html'));
});

// Trasa dla strony logowania (register.html)
app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

// Konfiguracja sesji
app.use(session({
  secret: process.env.sessionPass,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 3600000, // Czas trwania sesji w milisekundach
    httpOnly: true,  // Ciasteczko dostępne tylko dla protokołu HTTP
    secure: false,   // Ustaw na true, jeśli używasz HTTPS
    sameSite: 'lax'  // Zapobiega problemom z ciasteczkami w różnych domenach
  }
}));

app.use(bodyParser.json());

// Logowanie użytkownika
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log(req.body)
  // Dopasowanie użytkownika w bazie danych
  const query = 'SELECT * FROM users WHERE email = ? AND verified = 1';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Błąd zapytania:', err);
      res.status(500).send('Błąd serwera');
      return;
    }

    if (results.length > 0) {
      const user = results[0];

      // Sprawdzenie hasła
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.error('Błąd porównywania haseł:', err);
          res.status(500).send('Błąd serwera');
          return;
        }

        if (isMatch) {
          // Zapisanie danych użytkownika do sesji
          req.session.user = {
            id: user.user_id,
            name: user.name,
            surname: user.surname,
            email: user.email,
            currency: user.currency,
            img: user.user_img
          };

          console.log('Zalogowano użytkownika:', req.session.user);

          res.status(200).json({ message: 'Zalogowano pomyślnie' });
        } else {
          res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
        }
      });
    } else {
      res.status(401).json({ message: 'Nieprawidłowy email lub hasło' });
    }
  });
});

app.post('/userImgChange', (req, res) => {
  const { user_img } = req.body
  const userId = req.session.user.id

  if (!user_img) {
      return res.status(400).json({ error: 'Brak obrazu w żądaniu.' })
  }

  const query = 'UPDATE users SET user_img = ? WHERE user_id = ?'
  db.query(query, [user_img, userId], (err, results) => {
      if (err) {
          return res.status(500).json({ error: 'Błąd serwera.' })
      }
      req.session.user.img = user_img
      console.log(req.session)
      return res.status(200).json({ message: 'Obraz został zmieniony.'})
  });
});

app.get('/verify', (req, res) => {
  const token = req.query.token; // Pobierz token z URL
  // Sprawdzenie tokenu w bazie danych
  const query = 'SELECT * FROM users WHERE verification_token = ?';
  db.query(query, [token], (err, results) => {
    console.log(token)
    console.log("Wyniki zapytania:", results);

    if (err) {
      console.error('Błąd zapytania:', err);
      return res.status(500).send('Wystąpił błąd');
    }

    if (results.length === 0) {
      return res.status(400).send('Nieprawidłowy token!');
    }

    // Zweryfikowanie użytkownika
    const updateQuery = 'UPDATE users SET verified = 1 WHERE verification_token = ?';
    db.query(updateQuery, [token], (err) => {
      if (err) {
        console.log('Token z URL:', token); // Zobacz, czy token jest przekazywany poprawnie
        console.error('Błąd zapytania:', err);
        return res.status(500).send('Wystąpił błąd');
      }

      // Potwierdzenie udanej weryfikacji
      res.send(`
          <p>Konto zostało pomyślnie zweryfikowane!</p>
          <script>
              setTimeout(function() {
                  window.location.href = 'https://moneycount.app/login';
              }, 2000); // Przekierowanie po 2 sekundach
          </script>
      `);

    });
  });
});

// Rejestracja użytkownika
app.post('/register', (req, res) => {
  const { name, surname, email, password } = req.body;

  const imageOptions = {
    1: '../public/img/pictures/awatar1.svg',
    2: '../public/img/pictures/awatar2.svg',
    3: '../public/img/pictures/awatar3.svg',
    4: '../public/img/pictures/awatar4.svg',
    5: '../public/img/pictures/awatar5.svg',
    6: '../public/img/pictures/awatar6.svg'
  }

  const randomImageIndex = Math.floor(Math.random() * 6) + 1
  const userImage = imageOptions[randomImageIndex]


  const token = crypto.randomBytes(16).toString('hex');
  const verificationLink = `https://moneycount-app.onrender.com/verify?token=${token}`;
  console.log(token)

  const transporter = nodemailer.createTransport({
    host: process.env.mailHost,
    port: process.env.mailPort,
    secure: false,
    auth: {
      user: 'no-reply@moneycount.app',
      pass: process.env.mailPass
    }
  });

  // Treść wiadomości w HTML
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="pl">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Witaj w naszym serwisie</title>
      <link href="https://fonts.googleapis.com/css2?family=Funnel+Display:wght@300..800&family=Montserrat:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
      <style>
          body {
              font-family: "Funnel Display", sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
          }
          table {
              width: 100%;
              max-width: 600px;
              margin: 0 auto;
              border-spacing: 0;
          }
          .email-container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 20px;
              box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          .email-header {
              background-color: #f4f4f4;
              color: black;
              text-align: center;
              padding: 20px;
              border-radius: 8px 8px 0 0;
          }
          .email-body {
              padding: 20px;
              background-color: #ffffff;
              text-align: left;
              font-size: 16px;
              line-height: 1.6;
              color: #333333;
          }
          .email-footer {
              padding: 20px;
              text-align: center;
              font-size: 14px;
              color: #999999;
              background-color: #f4f4f4;
              border-radius: 0 0 8px 8px;
          }
          .button {
              background-color: rgb(220, 238, 255);
              color: black;
              padding: 10px 20px;
              text-decoration: none;
              border-radius: 5px;
              display: inline-block;
              font-size: 16px;
              margin-top: 20px;
              transition: 0.2s;
              font-weight: 600;
              cursor: pointer;
          }
          .button:hover {
              background-color: rgb(224, 234, 243);
          }
          @media screen and (max-width: 600px) {
              .email-container {
                  padding: 10px;
              }
              .email-header, .email-body, .email-footer {
                  padding: 10px;
              }
          }
      </style>
  </head>
  <body>
      <table>
          <tr>
              <td>
                  <div class="email-container">
                      <!-- Nagłówek -->
                      <div class="email-header">
                          <h1>Witamy na pokładzie!</h1>
                      </div>

                      <!-- Treść -->
                      <div class="email-body">
                          <p>Cześć ${name}!</p>
                          <p>Bardzo dziękujemy za zarejestrowanie się w naszym serwisie. Jesteśmy podekscytowani, że dołączyłeś do naszej społeczności!</p>
                          <p>Aby zakończyć proces rejestracji, kliknij przycisk poniżej:</p>
                          <a href="${verificationLink}" class="button">Zweryfikuj konto ✅</a>
                          <p>Jeśli nie możesz kliknąć w przycisk, skopiuj poniższy link do przeglądarki:</p>
                          <p><a href="${verificationLink}">${verificationLink}</a></p>
                      </div>

                      <!-- Stopka -->
                      <div class="email-footer">
                          <p>Jeśli masz jakiekolwiek pytania, skontaktuj się z naszym zespołem wsparcia.</p>
                          <p>&copy; 2024 Money Count. Wszystkie prawa zastrzeżone.</p>
                      </div>
                  </div>
              </td>
          </tr>
      </table>
  </body>
  </html>
  `;

  // Opcje wiadomości
  const mailOptions = {
    from: 'Money Count <no-reply@moneycount.app>',
    to: email,
    subject: '💰 Dziękujemy za rejestrację w Money Count!',
    html: htmlContent
  };

  // Wysyłanie wiadomości
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log('Błąd wysyłania: ', error);
    }
    console.log('Wiadomość wysłana: ' + info.response);
  });

  // Sprawdzenie, czy użytkownik już istnieje w bazie danych
  const checkQuery = 'SELECT * FROM users WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
      if (err) {
          console.error('Błąd zapytania:', err);
          res.status(500).send('Błąd serwera');
          return;
      }
      if (results.length > 0) {
          return res.status(400).json({ message: 'Użytkownik o takim adresie e-mail już istnieje.' });
      }

      let currency = 'PLN';

      // Haszowanie hasła
      bcrypt.hash(password, saltRounds, (err, hashedPassword) => {
          if (err) {
              console.error('Błąd haszowania hasła:', err);
              return res.status(500).send('Błąd serwera');
          }

          // Zapisanie nowego użytkownika w bazie danych
          const query = 'INSERT INTO users (name, surname, email, password, currency, verification_token, user_img) VALUES (?, ?, ?, ?, ?, ?, ?)';
          db.query(query, [name, surname, email, hashedPassword, currency, token, userImage], (err, result) => {
              if (err) {
                  console.error('Błąd zapytania:', err);
                  return res.status(500).send('Błąd serwera');
              }

              const userId = result.insertId; // ID nowo dodanego użytkownika

              // Dodanie testowego rekordu do tabeli "assets" dla nowego użytkownika
              const insertAssetQuery = 'INSERT INTO assets (user_id, title, value, category_id) VALUES (?, ?, ?, ?)';
              const testAssetData = {
                  user_id: userId,
                  title: 'Testowy zasób',
                  amount: 100,  // Domyślna wartość
                  category_id: 1  // Załóżmy, że to kategoria "Inne" (wartość 1)
              };

              db.query(insertAssetQuery, [testAssetData.user_id, testAssetData.title, testAssetData.amount, testAssetData.category_id], (err, assetResult) => {
                  if (err) {
                      console.error('Błąd zapytania podczas dodawania testowego zasobu:', err);
                      return res.status(500).send('Błąd serwera przy dodawaniu testowego zasobu');
                  }

                  // Zwrócenie odpowiedzi po zakończeniu rejestracji i dodaniu zasobu
                  res.status(201).json({ message: 'Rejestracja zakończona sukcesem! Sprawdź maila i zweryfikuj konto!' });
              });
          });
      });
  });
});

// Sprawdzanie statusu logowania
app.get('/auth', (req, res) => {
  console.log('Zapytanie do /auth');
  console.log('Sesja:', req.session); // Wyświetl sesję

  if (req.session.user) {
    console.log('Użytkownik zalogowany:', req.session.user);
    res.status(200).json({ loggedIn: true, user: req.session.user });
  } else {
    console.log('Brak aktywnej sesji użytkownika.');
    res.status(401).json({ loggedIn: false, message: 'Użytkownik nie jest zalogowany' });
  }
});

// Wylogowanie użytkownika
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Błąd podczas niszczenia sesji:', err);
      res.status(500).send('Błąd podczas wylogowywania');
      return;
    }
    res.clearCookie('connect.sid'); // Wyczyść ciasteczko sesji
    res.status(200).json({ message: 'Wylogowano pomyślnie' });
  });
});

// Pobranie zasobów użytkownika
app.get('/assets', (req, res) => {
  // Sprawdzamy, czy użytkownik jest zalogowany (czy ma aktywną sesję)
  if (!req.session.user) {
    return res.status(401).json({ message: 'Nieprawidłowa sesja. Użytkownik nie jest zalogowany.' });
  }

  // Pobieramy user_id z sesji
  const userId = req.session.user.id;

  // Zapytanie SQL do pobrania zasobów dla zalogowanego użytkownika
  const query = `
    SELECT assets.*, categories.category_name
    FROM assets
    INNER JOIN categories ON assets.category_id = categories.category_id
    WHERE assets.user_id = ?;
  `;

  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Błąd zapytania:', err);
      return res.status(500).send('Błąd serwera');
    }

    // Jeśli brak zasobów, zwróć pustą tablicę
    if (results.length === 0) {
      return res.status(404).json({ message: 'Brak zasobów dla tego użytkownika' });
    }

    // Zwróć wyniki dla użytkownika
    res.json(results);
  });
});


app.use(express.json());

// Endpoint do pobrania następnego indeksu
app.get('/next-index', (req, res) => {
  console.log('Zapytanie GET otrzymane dla /next-index'); // Log do debugowania

  // Zapytanie SQL do pobrania maksymalnego ID
  const sql = 'SELECT MAX(asset_id) AS lastIndex FROM assets';

  db.query(sql, (err, result) => {
    if (err) {
      console.error('Błąd podczas pobierania ostatniego indeksu:', err); // Log błędu
      return res.status(500).send('Błąd podczas pobierania ostatniego indeksu');
    }

    console.log('Wynik zapytania:', result); // Log wyniku zapytania

    // Jeśli brak rekordów, ustaw lastIndex na 0
    const lastIndex = result[0]?.lastIndex || 0;
    const nextIndex = lastIndex + 1;

    console.log('Następny indeks to:', nextIndex); // Log następnego indeksu
    res.json({ nextIndex });
  });
});


// Endpoint do usunięcia rekordu
app.delete('/delete-element', (req, res) => {
  console.log('Zapytanie DELETE otrzymane');  // Log do debugowania

  const id = req.body.id;
  console.log('Otrzymane ID do usunięcia:', id);  // Log ID

  if (!id) {
    console.log('Brak ID do usunięcia'); // Log, jeśli ID nie jest przekazane
    return res.status(400).send('Brak ID do usunięcia');
  }

  // Zapytanie SQL do usunięcia rekordu na podstawie ID
  const sql = 'DELETE FROM assets WHERE asset_id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Błąd podczas usuwania elementu:', err);  // Log błędu
      return res.status(500).send('Błąd podczas usuwania elementu');
    }

    console.log('Wynik zapytania:', result); // Log wyniku zapytania

    if (result.affectedRows > 0) {
      res.send('Element został usunięty');
    } else {
      res.status(404).send('Element o podanym ID nie został znaleziony');
    }
  });
});

// Endpoint do dodania aktywa
app.post('/add-asset', (req, res) => {
  const { title, category_id, value, ammount} = req.body;
  const userId = req.session.user.id;

  // Walidacja danych wejściowych
  if (!title || !category_id) {
      return res.status(400).send('Brak wymaganych danych (user_id, title, category_id)'); // Brak wymaganych danych
  }

  // Jeżeli value lub ammount są undefined, ustawiamy je na null
  const query = `
      INSERT INTO assets (title, category_id, value, ammount, user_id)
      VALUES (?, ?, ?, ?, ?)
  `;

  const values = [
      title,
      category_id,
      value !== undefined ? value : null,   // Jeżeli value nie jest undefined, przekazujemy wartość, w przeciwnym razie null
      ammount !== undefined ? ammount : null,  // Podobnie dla ammount
      userId
  ];

  db.query(query, values, (err, result) => {
      if (err) {
          console.error('Błąd podczas dodawania zasobu do bazy:', err);
          return res.status(500).send('Błąd serwera podczas dodawania zasobu');
      }

      console.log('Dodano nowy zasób:', result);

      // Zwracamy ID nowo dodanego zasobu
      res.status(201).json({ message: 'Element został dodany', assetId: result.insertId });
  });
});


// Funkcja obsługująca edycję elementu
app.post('/edit-asset', (req, res) => {
  const {title, category, price, ammount, id} = req.body;

  // Walidacja danych wejściowych
  if (!id || !title || !category) {
      return res.status(400).send('Brak wymaganych danych'); // Obsługa błędów
  }

  const query = `
    UPDATE assets
    SET title = ?, category_id = ?, value = ?, ammount = ?
    WHERE asset_id = ?
  `;

  const values = [title, category, price, ammount, id];

  db.query(query, values, (err, result) => {
    if (err) {
        console.error('Błąd podczas edycji zasobu w bazie:', err);
        return res.status(500).send('Błąd serwera podczas edycji zasobu');
    }

    if (result.affectedRows === 0) {
        return res.status(404).send('Element o podanym ID nie istnieje');
    }

    console.log('Zasób zaktualizowany:', result);

    res.status(200).json({ message: 'Element został zedytowany' });
  });
});

// Uruchomienie serwera na określonym porcie
const port = 3000; // Upewnij się, że jest zdefiniowana zmienna `port`
app.listen(port, () => {
  console.log(`Serwer działa na porcie ${port}`);
});

