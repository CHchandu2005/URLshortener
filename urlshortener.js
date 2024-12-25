const express = require('express');
const mongoose = require('mongoose');
const shortid = require('shortid');
const path = require('path');

const app = express();

// Connect to MongoDB
const mongoURI = "mongodb://localhost:27017/urlShortener";
mongoose.connect(mongoURI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Define URL schema and model
const urlSchema = new mongoose.Schema({
  shortId: { type: String, required: true, unique: true },
  originalUrl: { type: String, required: true, unique: true },
});
const Url = mongoose.model("Url", urlSchema);

// Middleware to serve static files and parse request bodies
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve the main page
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// POST route to generate and return a short URL
app.post("/geturl", async (req, res) => {
  let originalUrl = req.body.url;

  // Check if URL is provided
  if (!originalUrl) {
    return res.status(400).send({ error: "Please provide a URL." });
  }

  // Add "http://" if no protocol is specified in the URL
  if (!/^https?:\/\//i.test(originalUrl)) {
    originalUrl = `http://${originalUrl}`;
  }

  try {
    // Check if the original URL already exists in the database
    const existingUrl = await Url.findOne({ originalUrl });

    if (existingUrl) {
      // If URL exists, return the existing short ID
      res.send({ shortUrl: `http://localhost:5000/${existingUrl.shortId}` });
    } else {
      // If URL does not exist, create a new short ID and save it to the database
      const shortUrlId = shortid.generate();
      const newUrl = new Url({ shortId: shortUrlId, originalUrl });
      await newUrl.save();

      // Send back the shortened URL
      res.send({ shortUrl: `http://localhost:5000/${shortUrlId}` });
    }
  } catch (err) {
    console.error("Error checking/saving URL to database:", err);
    res.status(500).send({ error: "Internal server error" });
  }
});

// GET route to handle short URL redirection
app.get("/:shortUrlId", async (req, res) => {
  const shortUrlId = req.params.shortUrlId;

  try {
    const urlDoc = await Url.findOne({ shortId: shortUrlId });
    if (urlDoc) {
      res.redirect(urlDoc.originalUrl);
    } else {
      res.status(404).send("URL not found");
    }
  } catch (err) {
    console.error("Error retrieving URL from database:", err);
    res.status(500).send("Internal server error");
  }
});


const nodemailer = require('nodemailer');

app.post("/contact", (req, res) => {
  console.log(req.body);

  // Create a transporter for sending emails
  const transporter = nodemailer.createTransport({
    service: 'gmail', // or any other email service
    auth: {
      user: 'chanduchintalapudi9@gmail.com', // replace with your email address
      pass: 'ewhdmvqwiaowhfvs' // replace with your email password or app-specific password
    }
  });

  // Email options
  const mailOptions = {
    from: req.body.email, // sender address
    to: 'chanduchintalapudi9@gmail.com', // receiver address
    subject: 'New Contact Form Submission', // subject line
    text: `You have received a new message from:

    Name: ${req.body.name}
    Email: ${req.body.email}
    Description: ${req.body.description}`
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Something went wrong while sending the email.');
    }
    
    // Send a response with a success message and redirect
    res.send(`
      <script>
        alert('Message sent successfully');
        setTimeout(function() {
          window.location.href = '/'; // Redirect after alert
        }, 10);
      </script>
    `);
  });
});


// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});




