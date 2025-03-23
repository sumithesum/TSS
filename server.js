const express = require('express');
const fs = require('fs');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static('src'));
app.use(express.static('server')); 
app.use(express.static('build/contracts'));
app.use('/vendor', express.static(__dirname + '/node_modules'));
app.use('/contracts', express.static(__dirname + '/build/contracts'));


app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/main', (req, res) => {
    res.sendFile(__dirname + '/src/2.html');
});

app.get('/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).send('Error reading users');
  }
});

app.get('/2', async (req, res) => {
  res.sendFile(__dirname + '/src/2.html');
});

app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/server/login.html');
});

app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/server/register.html');
});

app.get('/show', async (req, res) => {
  try {
    const users = await getUsers();
    console.log(users);
    res.redirect('/login');
  } catch (err) {
    res.status(500).send('Error reading users');
  }
});

app.post("/register", async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const user = { name: req.body.name, password: hashedPassword };
    
    const users = await getUsers();
    
    users.forEach(u => {
      if(u.name == user.name) {
        res.status(409).send('User already exists');
        return;
      }
    });
    
    users.push(user);
    
    await saveUsers(users);
    
    res.status(201).send();
  } catch {
    res.status(500).send();
  }
});

app.post('/login', async (req, res) => {
  try {
    const users = await getUsers();
    const user = users.find(user => user.name === req.body.name);
    if (!user) {
      return res.status(404).send('Cannot find user');
    }
    const isPasswordValid = await bcrypt.compare(req.body.password, user.password);
    console.log(1);
    console.log(user);
    console.log(isPasswordValid);
    if (isPasswordValid) {
        res.status(200).send('Success');
    } else {
        res.status(403).send('Not allowed');
    }
  } catch (err) {
        res.status(500).send('Server error');
  }
});

function getUsers() {
  return new Promise((resolve, reject) => {
    fs.readFile(__dirname + '/users.json', 'utf8', (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(JSON.parse(data));
      }
    });
  });
}

function saveUsers(users) {
  return new Promise((resolve, reject) => {
    fs.writeFile(__dirname + '/users.json', JSON.stringify(users), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});