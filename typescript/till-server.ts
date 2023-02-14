import fs from 'fs';
import express from 'express';
import https from 'https';
import {auth} from "./server-modules/linn-api/linn-auth";
import {NextFunction, Request, Response} from "express";
import path from "path";
import {ping} from "./server-modules/mongo-interface/mongo-interface";
import itemRouter from "./routes/Items";
import userRouter from "./routes/Users";
import shopRouter from "./routes/Shop";

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

    const allowedOrigins = ["https://192.168.1.200:4430", "https://192.168.1.120:4430"];
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

    app.use((req, res, next) => {
        if (process.env.ANDROIDTOKEN === req.headers?.token) {
            next()
        } else {
            res.sendStatus(403)
        }
    })

    // System ping
    app.post('/Ping', async (req, res) => {
        res.send(await ping())
    });

    app.use('/Items/', itemRouter)
    app.use('/Shop/', shopRouter)
    app.use('/Users/', userRouter)

}