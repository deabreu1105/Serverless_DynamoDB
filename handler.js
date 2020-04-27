'use strict';

const serverless = require('serverless-http');
const express = require('express');
const app = express();

//Referenciamos  el aws-sdk para utilizar dynamoDB
const AWS = require('aws-sdk');

//Referenciamos body-parser para parsear los datos que nos traemos por post
const bodyParser = require('body-parser');


//Para que se cree la variable de entorno en aws dentro de la lambda
const USERS_TABLE = process.env.USERS_TABLE;

//definimos variable Para dynamoDB en local y de amazon
const IS_OFFLINE = process.env.IS_OFFLINE;
let dynamoDB;
if(IS_OFFLINE === 'true'){
  //Hacemos una instancia a DynamoDB en LOCAL
  dynamoDB = new AWS.DynamoDB.DocumentClient({
    region: 'localhost',
    endpoint: 'http://localhost:8000'
  });
}else{
  //Hacemos una instancia a DynamoDB de AMAZON
  dynamoDB = new AWS.DynamoDB.DocumentClient();
}



//Recuperar la informacion que enviamos via post al la aplicacion
app.use(bodyParser.urlencoded({extended: true}));

//Definimos las rutas

//Ruta Hola mundo
app.get('/', (req,res)  => {
  res.send('Hola mundo con Expressjs');
});

//Ruta para insertar
app.post('/users', (req,res) => {
  //destructuracion de req
  const {userId, name} = req.body;

  //Aqui definimos los parametros a insertar en la tabla de dynamoDB
  const params = {
    TableName: USERS_TABLE,
    Item:{
      userId, name
    }
  };
  //Aqui insertamos los parametros en la tabla dynamodb
  dynamoDB.put(params , (error) => {
    if(error){
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido crear el usuario'
      })
    }else{
      res.json({userId,name});
    }
  });

});

//Ruta para traer todo los usuarios
app.get('/users', (req,res) => {
  //Aqui nos traemos los datos a mostrar
  const params = {
    TableName: USERS_TABLE,
  };
  //Aqui mostramos los parametros en la tabla dynamodb
  dynamoDB.scan(params , (error, result) => {
    if(error){
      console.log(error);
      res.status(400).json({
        error: 'No se ha podido acceder a los usuarios'
      })
    }else{
      const {Items} = result;
      res.json({
        success: true,
        message: 'Usuarios cargados correctamente',
        users: Items
      });
    }
  })
});

//Ruta para traer solo un usuario
app.get('/users/:userId', (req, res) => {
  const params = {
    TableName: USERS_TABLE,
    //definir la key para trernos solo un usuario
    Key: {
      userId: req.params.userId,
    }
  };
  //Aqui mostramos los parametros en la tabla dynamodb
  dynamoDB.get(params, (error, result) => {
    if (error) {
      console.log(error);
      return res.status(400).json({
        error: 'No se ha podido acceder al usuario'
      })
    }
    if (result.Item) {
      const {userId, name} = result.Item;
      return res.json({userId, name});
    } else {
      res.status(404).json({error: 'Usuario no encontrado'})
    }
  })
});


module.exports.generic = serverless(app);