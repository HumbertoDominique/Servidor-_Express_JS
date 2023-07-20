import express from "express";
import __dirname from "./utils.js";
import handlebars from "express-handlebars";
import { productsRouter } from "./products/products.router.js";
import { cartRouter } from "./carts/carts.router.js";
import { viewsRouter } from "./views/views.router.js";
import { userRouter } from "./users/users.router.js";
import { messageService } from "./messages/messages.dao.js";
import { Server } from "socket.io";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import session from "express-session";
import MongoStore from "connect-mongo";
import { productService } from "./products/products.dao.js";
import passport from "passport";
import initializePassport from "./config/passport.config.js";
import { sessionRouter } from "./sessions/sessions.router.js";
import config from "./config/config.js";

//SET EXPRESS.
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//SET HANDLEBARS.
app.engine("handlebars", handlebars.engine());
app.set("views", __dirname + "/views");
app.set("view engine", "handlebars");

app.use(express.static(__dirname + "/public"));

//SET SERVIDOR WEB EN PUERTO 8080
const webServer = app.listen(config.port, () => {
  console.log(`Escuchando servidor web ${config.port}`);
});

//SET SERVIDOR WEBSOCKETS

//AL DETECTAR ALGUNA CONEXIÓN, ENVÍA MSJ AL CLIENTE; EL CLIENTE RETORNA SOLICITUD DE PRODUCTOS Y EL SERVIDOR ENVÍA "products" PARA SU RENDERIZADO EN LA VISTA REAL TIME PRODUCTS.

export const io = new Server(webServer);

io.on("connection", async (socket) => {
  console.log("Conexión con WebSockets");

  //CONEXIÓN CON REAL TIME PRODUCTS

  socket.emit("link", "link");

  socket.on("request", async (data) => {
    let products = await productService.getProducts();
    let { docs } = products;
    io.emit("products", docs);
  });

  //CONEXIÓN CON CHAT

  const messages = await messageService.getMessages();
  io.emit("messages", messages);

  socket.on("message", async (message) => {
    await messageService.addMessage(message);
    let messages = await messageService.getMessages();
    io.emit("messages", messages);
  });

  socket.on("greetings", (data) => {
    socket.broadcast.emit("connected", data);
  });
});

//COOKIES
app.use(cookieParser(config.cookieParser));

//SESSIONS y STORAGE
app.use(
  session({
    store: MongoStore.create({
      mongoUrl: config.mongoUrl,
      mongoOptions: {
        useNewUrlParser: true,
      },
      ttl: 10000,
    }),
    secret: config.cookieParser,
    resave: false,
    saveUninitialized: false,
  })
);

//SET PASSPORT
initializePassport();
app.use(passport.initialize());
app.use(passport.session());

//SET MONGODB
mongoose.connect(config.mongoUrl);

//SET DE ENDPOINTS.
app.use("/", viewsRouter);
app.use("/realtimeproducts", viewsRouter);
app.use("/chats", viewsRouter);
app.use("/api/products", productsRouter);
app.use("/api/carts", cartRouter);
app.use("/api/users", userRouter);
app.use("/api/sessions", sessionRouter);
