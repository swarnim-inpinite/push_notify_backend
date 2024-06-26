const express = require("express")
const User = require('./models/User');
const Event = require('./models/Event'); 
const cors = require("cors"); 
const bodyParser = require("body-parser");
const axios = require("axios");
const admin = require('firebase-admin');

const app = express()
app.use(cors());
app.use(bodyParser.json());
const connectDB = require('./database');

// Connect to MongoDB
connectDB();

require('dotenv').config();

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    next();
  });

const serviceAccount = {
    "type": process.env.TYPE,
    "project_id": process.env.PROJECT_ID,
    "private_key_id": process.env.PRIVATE_KEY_ID,
    "private_key": process.env.PRIVATE_KEY.replace(/\\n/g, '\n'),
    "client_email": process.env.CLIENT_EMAIL,
    "client_id": process.env.CLIENT_ID,
    "auth_uri": process.env.AUTH_URI,
    "token_uri": process.env.TOKEN_URI,
    "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
    "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
    "universe_domain": process.env.UNIVERSE_DOMAIN
  };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});



// Route to create a new user
app.post('/users', async (req, res) => {
    try {
        const { email, password, uid, pushNotificationToken } = req.body;
        const user = new User({ email, password, uid, pushNotificationToken });
        await user.save();
        res.status(201).json({ message: 'User created successfully', user });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});  




app.post('/events', async (req, res) => {
    try {
        const { date, description, userId } = req.body;
        const event = new Event({ date, description, userId });
        await event.save();
 
        console.log("Current user id is", userId);
 
        const otherUsers = await User.find({ uid: { $ne: userId } });
     
        // Project only email and pushNotificationToken fields
        const usersInfo = otherUsers.map(user => ({
            email: user.email,
            pushNotificationToken: user.pushNotificationToken  
        }));
 
        console.log("Other users in events are:", usersInfo);
 
        // Construct and send push notification messages to each user
        usersInfo.forEach(async (userInfo) => {
            const userToken = userInfo.pushNotificationToken;
            console.log("User token in store is", userToken);
 
            if (!userToken) {
                console.error('Error: FCM token is missing for user:', userInfo.email);
                return;
            }
 
            const message = {
                notification: {
                    title: 'New Event Notification',
                    body: 'A new event has been added!'
                },
                token: userToken
            };
 
            try {
                await admin.messaging().send(message);
                console.log('Successfully sent message to user:', userInfo.email);
            } catch (error) {
                console.error('Error sending message to user:', userInfo.email, error);
            }
        });
 
        res.status(201).json({ message: 'Event added successfully', event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
    








app.listen(3001, () => {
    console.log("server running on port 3001")
})