# MONGO SETUP
Start the server in one window, in the other use a client to connect and interact

```shell
## start the service 

mongod -f C:\Users\omar.botia\Documents\sharedBooks\backend\mongod.config

## connect with mongo shell

mongo --port 27001

use admin

db.auth("node","node123")

## shutdown the server safely

mongo --port 27001

use admin

db.auth("node","node123")

db.shutdownServer()

## connection string in MongoDB URI format

'mongodb://node:node123@127.0.0.1:27001/shared_books?authSource=admin'

## update many 

db.books.updateMany({}, {$set: {'location': 'closet'}});
```

## MongoDB in Atlas

```shell

User: node
pwd:  node123

# Connection string 
'mongodb+srv://root:123root123@sharedbooks-hqedr.mongodb.net/test' 

mongodb+srv://<username>:<password>@sharedbooks-hqedr.mongodb.net/test

# connection from the mongo shell 

mongo "mongodb+srv://sharedbooks-hqedr.mongodb.net/test" --username 

```

# Backend run

Start the express.js server and listen the requests

```shell
cd C:\Users\omar.botia\Documents\sharedBooks\backend
npm start

```

# Frontend run

Start the react service 

```shell
cd C:\Users\omar.botia\Documents\sharedBooks\shared-book-front
npm start

```

## mongoose 

Es un libreria para operar sobre mongo, aqui se defin modelos, que son las colecciones y las operaciones sobre ellas

## definicion de modelo

cuando se define un modelo se define en singular, sin embargo la creacion en la colleccion de la base de datos se hace en plural, la definicion de las llaves es case sensitive, no es lo mismo definir en el modelo una llave Borrows y guardar en la coleccion una llave borrows, cuando lee la llave Borrows sale vacia y la llave borrows trae el contenido.

cuando se van a adicionar valores de referencia a otras colecciones se adiciona un documento indicando que es de tipo object id y que refiere a otro modelo de mongoose, esto es util para poder consultar estos datos luego con populate.

cuando se tiene documentos embebidos dentro de otro documento/arreglo mongoose adiciona un ObjectId por defecto.

cuando se hagan operaciones de actualizacion o de escritura sobre los documentos de la base de datos, utilizar el metodo **save()** este metodo tiene middlewares y validaciones adicionales

```javascript
user: {type: Schema.ObjectId, ref: 'user'}
```

## escritura y actualizaciones 

Cuando se hacen operaciones actualizacion se puede consultar el documento a actualizar, efectuar las actualizaciones necesarias y utilizar el metodo **save**, en la documentacion lo recomiendan en vez de utilizar update o findByIdAndUpdate

## lectura

### Consultar array que cumpla condiciones $elemMatch

Se utiliza este metodo para verificar que un elemento de un arreglo cumpla con ciertas condiciones, en este proyecto se empleo en el metodo validateUser del control de usuarios, lo que se hizo fue verificar si habia un documento en el que el usuario fuese el usuario al que se le va a prestar el libro y que tubiera un prestamo activo, si esas dos condiciones se cumplen en un mismo documento no se puede prestar el libro

### Metodo populate

Cuando se va a hacer un join con otra coleccion la mejor forma de ir es utilizar el metodo populate de moongose, se selecciona cual es la llave que se quiere traer y cuales son los campos que se requieren de la otra coleccion. Si el populate se llama despues de que se ha traido el documento se debe poner el metodo execPopulate() para que lo ejecute. primera parte la llave que se va a sustituir, segunda parte los campos que se requieren

```javascript
await book.populate('borrows.user', '_id name surname').execPopulate();
```

### consultar ObjectId relacionado

cuando se define una llave del tipo ObjectId se debe crear un objeto de este tipo antes de hacer la consulta, porque no hace el cast automatico de string a ObjectId, antes de probar la consulta en moongose probarla en compass

```javascript
// consulta en compass 
{ 'borrows.user': { $eq: ObjectId('5eaf0140732a0e37f41bb575') } }

// consulta por medio de mongoose
var ObjectId = require('mongoose').Types.ObjectId; 
var query = { 'borrows.user': { $eq: new ObjectId(user[0]._id) } }; 
```

### operadores and y or 

se consultan igual que en compass

```javascript
{ $and: [ { 'borrows.user': { $eq: ObjectId('5eaf0140732a0e37f41bb575') } }, { 'borrows.activeBorrow': true }] }
```

### consultar que string contenga palabra case-insensitive

se utiliza regex de la siguiente forma 

```javascript
authors: {$regex: `.*${req.params.word}.*`, $options: 'i'}
```

### consultar que string sea igual a case-insensitive

```javascript
{ title :  {$regex: `^${titlePa}`, $options: 'i'  } }
```

### manejo de fechas 

moongose hace el parsing de las fechas de forma automatica cuando se a utilizado el metodo **.toISOstring** antes de enviar una fecha

si se quiere pasar del string de la fecha a objeto Date se hace 

```javascript
const dateInServer = new Date(req.query.date);
```

### Consultas 

Estas consultas funcionan como ejemplos

0. Consultar libros que contengan la palabra XX en el nombre 
```javascript
{ title: { $regex: '21'}}
```
1. Cuantos libros tiene prestados el usuario actualmente ?

```javascript
{ borrows: { $elemMatch: { 'user': { $eq: ObjectId('5ea34fe737861e2eb00353e9') } ,  'activeBorrow': true } } }
```

2. tiene el usuario un prestamo activo con el libro ?

```javascript
{ $and: [ { _id: {$eq: ObjectId('5ea5921783c56d33548fbce1') } }, { borrows: { $elemMatch: { user: { $eq: ObjectId('5ea34fe737861e2eb00353e9') }, activeBorrow: true } } } ] } 
```

3. Cuantos prestamos ha tenido un usuario
```javascript
{"borrows.user": {$eq: ObjectId('5eb1dd437a891e2e4824b201')}}
```

4. Existe la llave en el documento ? 
```javascript
borrows: { $exists: true } 
```