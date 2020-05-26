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

## Solucion de: 
https://dev.to/lawrence_eagles/causes-of-heroku-h10-app-crashed-error-and-how-to-solve-them-3jnl
cambiar al puerto que asigna heroku // heroku pone un puerto diferente cada vez 

yo le asigno 

var port = process.env.APP_PORT;

heroku 

var port = process.env.PORT;

de esta forma ya se puden hacer las peticiones y no es necesario especificar puerto 

las peticiones al backend de heroku se hacen 

https://shared-books-backend.herokuapp.com/api/quote


## deploy del frontend 

https://stackoverflow.com/questions/60834785/cant-deploy-a-project-to-heroku

create react app genera un web server para desarrollo con webpack

cuando se da el comando de inicio que trae por defecto heroku intenta correrlo y no puede para evitar esto 

se debe adicionar un buildpack de heroku https://github.com/mars/create-react-app-buildpack

se pude hacer el deploy como se hace desde la cuenta de github y en la opcion settings -> buildpacks adicionar la url del buildpack