const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(session({
  secret: 'taskmanager_secret',
  resave: false,
  saveUninitialized: false
}));

// Load tasks from file
function loadTasks() {
  if (!fs.existsSync('tasks.json')) {
    fs.writeFileSync('tasks.json', JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync('tasks.json'));
}

// Save tasks to file
function saveTasks(tasks) {
  fs.writeFileSync('tasks.json', JSON.stringify(tasks, null, 2));
}

// Auth middleware
function requireLogin(req, res, next) {
  if (req.session.user) return next();
  res.redirect('/login.html');
}

// LOGIN
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    req.session.user = username;
    res.redirect('/index.html');
  } else {
    res.redirect('/login.html?error=1');
  }
});

// LOGOUT
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// GET all tasks
app.get('/tasks', requireLogin, (req, res) => {
  res.json(loadTasks());
});

// ADD task
app.post('/tasks', requireLogin, (req, res) => {
  const tasks = loadTasks();
  const newTask = {
    id: Date.now(),
    title: req.body.title,
    description: req.body.description,
    status: 'pending',
    createdAt: new Date().toLocaleDateString()
  };
  tasks.push(newTask);
  saveTasks(tasks);
  res.json(newTask);
});

// UPDATE task status
app.put('/tasks/:id', requireLogin, (req, res) => {
  const tasks = loadTasks();
  const index = tasks.findIndex(t => t.id == req.params.id);
  if (index !== -1) {
    tasks[index].status = req.body.status;
    tasks[index].title = req.body.title || tasks[index].title;
    tasks[index].description = req.body.description || tasks[index].description;
    saveTasks(tasks);
    res.json(tasks[index]);
  } else {
    res.status(404).json({ error: 'Task not found' });
  }
});

// DELETE task
app.delete('/tasks/:id', requireLogin, (req, res) => {
  let tasks = loadTasks();
  tasks = tasks.filter(t => t.id != req.params.id);
  saveTasks(tasks);
  res.json({ success: true });
});

app.get('/', (req, res) => {
  res.redirect('/login.html');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});