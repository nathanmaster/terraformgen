const express = require('express');
const session = require('express-session');
const passport = require('./auth'); // Import your auth.js
const { Pool } = require('pg');
const { spawn } = require('child_process');
const fs = require('fs');
const cors = require('cors');
const { checkJwt } = require('./auth'); // Auth0 JWT middleware

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
app.use(cors({
  origin: 'http://localhost:3000', // Frontend URL
  credentials: true,
}));

// Helper: Upsert user by Auth0 user id (sub)
async function ensureUserExists(auth0Sub) {
  // Try to find user
  const result = await pool.query('SELECT * FROM users WHERE auth0_sub = $1', [auth0Sub]);
  if (result.rows.length === 0) {
    // Insert new user
    await pool.query('INSERT INTO users (auth0_sub) VALUES ($1)', [auth0Sub]);
  }
}

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

// Remove custom signup and login endpoints
// app.post('/api/signup', ...);
// app.post('/api/login', ...);

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
app.post('/api/honeypots', checkJwt, async (req, res) => {
  const userId = req.auth.sub; // Auth0 user id
  // Ensure user exists in DB
  await ensureUserExists(userId);
  const { region, instanceType, cowrieConfig, ami } = req.body;
  try {
    const tfOutput = await applyTerraform({ region, instanceType, cowrieConfig, ami });
    // Optionally: Store tfOutput in DB here
    await pool.query(
      'INSERT INTO honeypots (user_id, region, instance_type, cowrie_config, outputs, status) VALUES ($1, $2, $3, $4, $5, $6)',
      [userId, region, instanceType, cowrieConfig, JSON.stringify(tfOutput), 'active']
    );
    res.json({ message: 'Honeypot deployment initiated', terraformOutput: tfOutput, user: req.user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Terraform deployment failed', error: err.message });
  }
});

app.get('/api/honeypots', checkJwt, async (req, res) => {
  const userId = req.auth.sub;
  // Ensure user exists in DB
  await ensureUserExists(userId);
  const result = await pool.query('SELECT * FROM honeypots WHERE user_id = $1', [userId]);
  res.json(result.rows);
});

app.delete('/api/honeypots/:id', checkJwt, async (req, res) => {
  const userId = req.auth.sub;
  // Ensure user exists in DB
  await ensureUserExists(userId);
  const { id } = req.params;
  // Check ownership
  const result = await pool.query('SELECT * FROM honeypots WHERE id = $1 AND user_id = $2', [id, userId]);
  if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
  // Run Terraform destroy
  // ...destroy logic...
  await pool.query('UPDATE honeypots SET status = $1 WHERE id = $2', ['destroyed', id]);
  res.json({ message: `Honeypot ${id} deletion initiated`, user: req.user });
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
