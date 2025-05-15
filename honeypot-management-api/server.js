const express = require('express');
const session = require('express-session');
const passport = require('./auth'); // Import your auth.js
const { Pool } = require('pg');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const port = 3001;

// PostgreSQL connection pool
const pool = new Pool({
    host: 'localhost',  // Replace
    port: 5432,
    database: 'honeypots', // Replace
    user: 'azureuser',    // Replace
    password: '!Thisismypassword!',  // Replace
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: '', // Replace with a strong, random secret
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false }, // Set to true in production with HTTPS
  })
);
app.use(passport.initialize());
app.use(passport.session());

// Add applyTerraform function here
async function applyTerraform(config) {
  // 1.  Generate Terraform configuration (e.g., using a template)
  const tfConfig = `
    resource "aws_instance" "cowrie" {
      ami           = "${config.ami}"
      instance_type = "${config.instanceType}"
      // ... other config ...
    }
    // ... other resources from your module
  `;
  // For simplicity, we'll write to a file. For a real app, use a templating engine.
  fs.writeFileSync('terraform.tf', tfConfig);

  // 2.  Initialize Terraform
  const init = spawn('terraform', ['init'], { cwd: './' });
  init.stdout.on('data', (data) => console.log(`terraform init: ${data}`));
  init.stderr.on('data', (data) => console.error(`terraform init error: ${data}`));
  await new Promise((resolve, reject) => {
    init.on('close', (code) => {
      if (code !== 0) reject(new Error(`terraform init exited with code ${code}`));
      resolve();
    });
  });

  // 3.  Apply Terraform
  const apply = spawn('terraform', ['apply', '-auto-approve'], { cwd: './' });
  apply.stdout.on('data', (data) => console.log(`terraform apply: ${data}`));
  apply.stderr.on('data', (data) => console.error(`terraform apply error: ${data}`));
  await new Promise((resolve, reject) => {
    apply.on('close', (code) => {
      if (code !== 0) reject(new Error(`terraform apply exited with code ${code}`));
      resolve();
    });
  });

  // 4.  Get Outputs
  const output = spawn('terraform', ['output', '-json'], { cwd: './' });
  let outputData = '';
  output.stdout.on('data', (data) => {
    outputData += data;
  });
  output.stderr.on('data', (data) => console.error(`terraform output error: ${data}`));
  await new Promise((resolve, reject) => {
    output.on('close', (code) => {
      if (code !== 0) reject(new Error(`terraform output exited with code ${code}`));
      resolve();
    });
  });

  const parsedOutput = JSON.parse(outputData);
  console.log(parsedOutput);
  return parsedOutput;
}

// API Routes

// Route for user signup (simplified - you'll need proper validation)
app.post('/api/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    //  **NEVER** store plain text passwords.  Use bcrypt to hash!
    const result = await pool.query('INSERT INTO users (username, password) VALUES ($1, $2) RETURNING *', [username, password]);
    const newUser = result.rows[0];
    res.status(201).json(newUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Login route
app.post('/api/login', passport.authenticate('local'), (req, res) => {
  res.json({ message: 'Logged in successfully', user: req.user });
});

// Logout route
app.get('/api/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Protected route example
app.get('/api/protected', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ message: 'You are authenticated', user: req.user });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// Honeypot API -  Placeholder.  Terraform integration is more involved.
app.post('/api/honeypots', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { region, instanceType, cowrieConfig, ami } = req.body;
  //  TODO:  1. Validate user input.
  //  TODO:  2.  Generate/Modify Terraform config (using a library or string templating).
  //  TODO:  3.  Execute Terraform (using child_process.spawn in Node.js).
  //  TODO:  4.  Store deployment info in the database.
  //  TODO:  5.  Handle errors and return appropriate responses.
  try {
    const tfOutput = await applyTerraform({ region, instanceType, cowrieConfig, ami });
    // Optionally: Store tfOutput in DB here
    res.json({ message: 'Honeypot deployment initiated', terraformOutput: tfOutput, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terraform deployment failed', error: err.message });
  }
});

app.get('/api/honeypots', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  // TODO: 1.  Fetch honeypot deployment status from the database.
  res.json({ message: 'List of honeypots', user: req.user }); // Placeholder
});

app.delete('/api/honeypots/:id', (req, res) => {
  if (!req.isAuthenticated()) {
     return res.status(401).json({ message: 'Unauthorized' });
  }
  const { id } = req.params;
  // TODO: 1.  Validate user authorization to delete this honeypot.
  // TODO: 2.  Execute Terraform destroy.
  // TODO: 3.  Update database status.
  res.json({ message: `Honeypot ${id} deletion initiated`, user: req.user }); // Placeholder
});

//  Optional:  Endpoint for Kibana to trigger Terraform (more complex)
app.post('/api/kibana/trigger-apply', (req, res) => {
  // TODO: 1.  Authenticate the request (very important for security!).  How will Kibana authenticate?
  // TODO: 2.  Extract parameters from the Kibana payload.
  // TODO: 3.  Generate/Modify Terraform config.
  // TODO: 4.  Execute Terraform apply.
  // TODO: 5.  Store deployment info and status.
  console.log('Kibana triggered a Terraform apply:', req.body);
  res.json({ message: 'Terraform apply triggered by Kibana' });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
