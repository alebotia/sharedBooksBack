# Heroku 

trouble shooting errors 
El primer error que tenia era que el script start del package.json estaba mal definido, localmente se puede correr con nodemon para que el servidor reinicie con cada falla, pero en heroku se necesita es un node index.js 

el otro error era que la ruta del parametro --icu-data-dir tenia que ir con / y no con \


Comando de heroku,

heroku login 

heroku logs -a shared-books-backend

heroku pone un puerto por defecto a la app, si uno lo pone puede estallar la aplicacion, para verlo ejecutar el comando:

heroku run printenv -a shared-books-backend

heroku restart // despues que la app crash


cambiar al puerto que asigna heroku 

yo le asigno 

var port = process.env.APP_PORT;

heroku 

var port = process.env.PORT;

