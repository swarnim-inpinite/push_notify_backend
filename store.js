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

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY;


// Allow requests from your Vercel-hosted frontend
// app.use(cors({
//     // origin: 'https://push-notify-frontend.vercel.app',
//     origin: 'http://localhost:3001',
//     optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }));

app.use(cors()); 



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

        const tokens = usersInfo.filter(userInfo => userInfo.pushNotificationToken).map(userInfo => userInfo.pushNotificationToken);

        const message = {
            app_id: ONESIGNAL_APP_ID,
            contents: { en: 'A new event has been added!' },
            headings: { en: 'New Event Notification' },
            include_player_ids: tokens
        };

        try {
            const response = await axios.post('https://onesignal.com/api/v1/notifications', message, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`
                }
            });

            console.log('Successfully sent message:', response.data.id);
        } catch (error) {
            console.error('Error sending message:', error.response.data.errors);
        }
        
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




app.listen(3001, () => {
    console.log("server running on port 3001")
})