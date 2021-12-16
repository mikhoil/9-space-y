import * as path from "path";
import fs from "fs";
import express from "express";
import https from "https";
import cookieParser from "cookie-parser";

const rootDir = process.cwd();
const port = 3000;
const app = express();
const noRedirect = ['login', 'api', 'static'];

const loginMiddleware = (req, res, next) => {
    const root = req.url.split('/')[1];
    noRedirect.includes(root) || req.cookies.username ?
        next() :
        res.redirect('/login');
};

app.use(express.static('spa/build'));
app.use(cookieParser());
app.use(loginMiddleware);

app.get('/login', (req, res) => res.sendFile(path.join(rootDir, "spa/build/index.html")));

app.get("/client.mjs", (req, res) => {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.sendFile(path.join(rootDir, "client.mjs"), { maxAge: -1, cacheControl: false });
});

app.get("/api/login", (req, res) => {
    const username = req.query.username;
    res.cookie('username', username, { 'httpOnly': true, 'secure': true, 'sameSite': 'Strict' });
    res.json({ 'username': username });
});

app.get("/api/user", (req, res) => res.json({ 'username': req.cookies.username }));

app.get("/api/logout", (req, res) => {
    res.clearCookie('username');
    res.redirect('/');
})

app.get('/*', (req, res) => res.redirect('/'));

https.createServer({
        key: fs.readFileSync("certs/server.key"),
        cert: fs.readFileSync("certs/server.cert"),
    },
    app
).listen(port, () => console.log(`Я работаю на ${port}`));