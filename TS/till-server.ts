import fs = require('fs');
import express = require('express');
import https = require('https');

import mongoI = require('./server-modules/mongo-interface/mongo-interface')
import {auth} from "./server-modules/linn-api/linn-auth";
const config = require("./config/config.json")

import {NextFunction, Request, Response} from "express";
import * as path from "path";

const app = express();
app.all('*', ensureSecure)
app.use("/images", express.static(path.join(__dirname, "../images")));
app.disable('x-powered-by')

const privateKey = fs.readFileSync('./config/ucc.key', 'utf8');
const certificate = fs.readFileSync('./config/ucc.crt', 'utf8');
const credentials = {key: privateKey, cert: certificate};

const server = https.createServer(credentials, app);
server.listen(4430, async () => {
    console.log(`HTTPS server listening`)
    await startSever()
    console.log(`Server started`)
});

function ensureSecure(req: Request, res: Response, next: NextFunction) {
    if (req.url.startsWith("/images/")) {
        const filePath = path.join(__dirname, "..", req.url)
        fs.existsSync(filePath)
            ? res.sendFile(filePath)
            : res.status(404).send('Image not found');
    } else {
        if (req.secure) {
            return next()
        } else {
            res.redirect('https://' + req.headers.host)
        }
    }
}


const startSever = async () => {
    console.log("Server starting")
    await auth(false)

    // express text parser maximums (to allow handling of large JSON text strings)
    app.use(express.json({
        limit: '5mb'
    }));
    app.use(express.urlencoded({
        limit: '5mb',
        extended: true
    }));

    const RateLimit = require('express-rate-limit');

    const limiter = new RateLimit({
        windowMs: 60 * 1000, // 1 minutes
        max: 600, // limit each IP to 60 requests per windowMs
        delayMs: 0 // disable delaying - full speed until the max limit is reached
    });

    //  apply to all requests
    app.use(limiter);

    const allowedOrigins = ["https://192.168.1.200:4430","https://192.168.1.120:4430"];
    app.use(function (req, res, next) {
        const origin = "https://" + req.headers.host;
        if (allowedOrigins.includes(origin)) {
            next();
        } else {
            res.sendStatus(403)
        }
    })

    //CORS filtering
    app.use(function (req, res, next) {
        const origin = req.headers.origin;
        if (origin) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.header("Access-Control-Allow-Credentials", "true")
        res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authorization, token");
        next();
    });

    //check for cookie
    app.use((req, res, next) => {
        if (req.headers.token) {
            if (config.tokens[(req.headers.token.toString())]) {
                next()
            } else {
                res.sendStatus(403)
            }
        }
    })

    // System ping
    app.post('/Ping', async (req, res) => {
        res.send(await mongoI.ping())
    });

    const ItemsRoutes = require('./routes/Items.js')
    app.use('/Items/', ItemsRoutes)

    const shopRoutes = require('./routes/Shop.js')
    app.use('/Shop/', shopRoutes)

    const userRoutes = require('./routes/Users.js')
    app.use('/Users/', userRoutes)

}