const express = require("express")
const User = require('./models/User');
const Event = require('./models/Event'); 
const cors = require("cors"); 
const bodyParser = require("body-parser");
const admin = require('firebase-admin');

const app = express()
app.use(cors());
app.use(bodyParser.json());
const connectDB = require('./database');

// Connect to MongoDB
connectDB();

require('dotenv').config();


// Allow requests from your Vercel-hosted frontend
app.use(cors({
    origin: 'https://push-notify-frontend.vercel.app',
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));






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



// Route to create a new event
app.post('/events', async (req, res) => {
    try {
        const { date, description } = req.body;
        const event = new Event({ date, description });
        await event.save();

        // Fetch all users from the database
        const users = await User.find();
        //console.log("users are", users);


        // Extract push notification tokens from users
        const pushNotificationTokens = users.map(user => user.pushNotificationToken);
        console.log("Tokens are", pushNotificationTokens);

        res.status(201).json({ message: 'Event added successfully', event });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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



// Route to get other users and their push notification tokens
app.get('/otherUsers', async (req, res) => {
    try {
        // Get the current user's UID from the request parameters
        const currentUserUID = req.query.currentUserUID;
        console.log("Current user id is", currentUserUID)

        // Find all users except the current user
        const otherUsers = await User.find({ uid: { $ne: currentUserUID } });

        // Extract the relevant information for each user
        const usersInfo = otherUsers.map(user => ({
            email: user.email,
            pushNotificationToken: user.pushNotificationToken
        }));

        //Construct and send push notification messages to each user
        for (const user of usersInfo) {
            const message = {
                notification: {
                    title: 'New Event Notification',
                    body: 'A new event has been added!'
                },
                token: user.pushNotificationToken
            };

            try {
                await admin.messaging().send(message);
                console.log('Successfully sent message to user:', user.email);
            } catch (error) {
                console.error('Error sending message to user:', user.email, error);
            }
        }

        res.status(200).json(usersInfo);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});









app.listen(3001, () => {
    console.log("server running on port 3001")
})