//importing dependencies

import express from 'express';
import bodyParser from 'body-parser';
import {dirname, join} from 'path';
import  {fileURLToPath}  from "url";

import indexRouter from './routes/index.js';

import Bolsillos from './routes/recursos/bolsillos.js';



const app = express();
app.use(bodyParser.json())

// instancia socket io servidor

new Bolsillos(app);





//middlewares
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static('public'))



const __dirname = dirname(fileURLToPath(import.meta.url)); //establecemos la ruta relativa de este archivo
app.set('views', join(__dirname, 'views'));
app.use(express.static(join(__dirname, 'public')));
app.use(indexRouter); // app usa las rutas  


