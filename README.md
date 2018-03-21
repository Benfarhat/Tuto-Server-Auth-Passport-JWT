# Mise en place d'un serveur Authentifié
## Préparation du serveur
Tout d'abord initialisons notre projet dans un répertoire vide
```
npm init -y
```

si vous allez versionner votre travail avec git, pensez à rajouter le fichier `.gitignore` à travers lequel nous demanderons à git de ne pas suivre (tracker) le contenu du repertoire node_modules, il suffit tout simplement d'écrire dedans:

```
node_modules
```

Puis installons les modules necessaires au bon fonctionnement du projet

```
yarn add express body-parser morgan mongoose passport passport-local passport-jwt bcrypt-nodejs jwt-simple mongoose rotating-file-stream
```

## Modules utilisés pour le serveur

### Express js

express est un mini-framework node (un framework est un niveau d'abstraction au dessus des librairies) qui va nous permettre de développer en NodeJs plus rapidement
il suffira par exemple juste d'appeler `app.METHOD(PATH, HANDLER)` pour gérer nos routes vers les méthodes get, post, put, delete, etc...

Pour exécuter un serveur, celui ci doit être en écoute sur ce qu'on appelle un port (une sorte de canal de communication). Rappelez vous qu'il s'agit d'un serveur dont l'une des principales fonctions est d'être à l'écoute des requêtes des clients.
Par défaut http écoute sur le port 80 et https sur le port 443, mais en mode développement l'ecoute se fera sur un autre port de préférence non utilisé par un autre service pour éviter les collisions (lors du lancement de votre serveur, un message d'erreur vous avertira que le port est déjà utilisé)
Il est préférable d'utilisé un port supérieur à 1024 dont la plage contient les ports logiciels connus `well-known ports` par exemple 25 est celui du SMTP (mail en envoi), 110 celui du POP3 (mail en réception), 20 et 21 sont utilisé par FTP (pour le transfert de fichier etc..)
la commande netstat -ab (en mode administrateur) permet sur windown d'afficher la liste des ports utilisé (en écoute pour attente de connexion ou établi pour les connexions en cours)
Dans mon cas le port 22348 est utilisé, si nous exécutons notre serveur comme suit:

```
const port = process.env.port || 22348
// process.env.port permet de voir s'il n'y a pas une valeur port déjà implémentée dans les paramètres d'environnement, sinon on utilise 22348
app.listen(port)
```
Nous obtenons l'erreur suivante:

    events.js:183
        throw er; // Unhandled 'error' event
        ^

    Error: listen EADDRINUSE :::22348
        at Object._errnoException (util.js:1024:11)
        at _exceptionWithHostPort (util.js:1046:20)
        at Server.setupListenHandle [as _listen2] (net.js:1351:14)
        at listenInCluster (net.js:1392:12)
        at Server.listen (net.js:1476:7)
        
        //...

Cette erreur peut également apparaitre si vous lancer votre serveur deux fois de suite, si vous avez besoin d'exécuter plusieurs fois votre serveur, vous devez implémenter une solution dite [`cluster`](https://www.npmjs.com/package/express-cluster) qui vous permettra d'avoir un processus `master` et autant de process `worker` (Notez qu'il est préférable de bien dimensionner le nombre de worker a exécuter pour ne pas surcharger les processeurs de votre serveur). 

Pour la suite nous utiliserons le port `3000`. Notez que nous n'avons pas préciser d'adresse d'écoute puisqu'en effet un routeur (ou n'importe quel autre équipement muni d'une carte réseau) a la possibilité d'avoir plusieurs adresse IP et donc d'être présent sur plusieurs réseau.
si nous voulons forcer l'écoute sur l'adresse IPV4 local nous écrirons ceci:

```
const port = process.env.port || 3000
app.listen(port, '127.0.0.1',  () => { console.log('-=-=Server listening on port 3000=-=-')})
```

**Un mot sur nodemon**

[nodemon](https://github.com/remy/nodemon#nodemon) est un outil assez intéressant lors de vos developpement car il permet de relancer vos scripts à chaque modification mais également d'attendre une correction des fichiers qui pourraient avoir cause un crash de l'application, par défaut il suit (fonction de watch) les modifications de tous les fichiers du repertoire et des sous repertoires mais vous pouvez modifier son fonctionnement: `nodemon --watch models --watch libs controllers/authentication.js`, ou encore de choisir les extensions des fichiers à surveiller: `nodemon -e js,css,json`

Pour forcer un redémarrage (restart en anglais) il suffit de rentrer les deux lettres suivants `rs` dans la fenêtre ou est exécuté nodemon et d'appuyer sur entrée.

Pour lancer votre application avec node vous devez exécuter la commande `node index.js`, dans le cas de nodemon il suffit de changer node par nodemon: `nodemon index.js`

Par défaut le commande `nodemon` va scanner le contenu du fichier package.json et exécuter le script start, donc si vous mettez dans package.json:

```
"scripts": {
"start": "nodemon index.js"
},
```
Alors la commande nodemon sera l'équivalent des commandes: `npm start` et `yarn start`

```
PS D:\labs\Authentication\server> nodemon
[nodemon] 1.17.1
[nodemon] to restart at any time, enter `rs`
[nodemon] watching: *.*
[nodemon] starting `node index.js`
-=-=Server listening on port 3000=-=-
```

Continuons dans nos requêtes gérées par express, si par exemple nous testons ceci:

```
app.get('/', function (req, res) {
res.send('Hello World!')
})
```
Cela affichera "Hello World" si vous vous rendez sur la racine de votre site, (`req` représente la requête et `res` la réponse).
Notez ici que nous utilons `res` (la réponse) pour envoyer un message via `res.end(CONTENU A EVOYER)`.

Dans le cas de la méthode POST (utilisé lors de l'envoi d'un formulaire):

```
app.post('/signup', function (req, res) {
console.log(req)
res.send('Got a POST request')
})
```
vous permettra d'intercepter les requêtes POST vers l'adresse "/signup"

Si par exemple j'essait d'envoyer via `Postman`, `RestClient` ou n'importe quel autre client Rest, le contenu suivant:

```
POST http://localhost:3000/signup 
Content-Type: application/json 
{
"username":"monuser",
"password":"monpwd"
}
```
en observant le contenu de `req` on ne trouve ni le contenu de username ou encore moins celui de password, par contre une commande comme `console.log(req.headers)` nous retournerais bien le contenu de l'entête, pour récupérer le contenu du body nous utiliserons le module `body-parser`


### Body Parser

#### Notion de middleware

body-parser est un middleware, c'est à dire qu'il se positionnera en milieu de chemin entre le `requêteur` (client) et le `répondeur` (serveur), ce qui permettra ainsi de réaliser des opérations diverses et variées qui ne sont pas gérées par l'application en elle même mais qui également pourront l'en décharger. C'est comme si à l'entrée d'une université vous mettiez un agent qui déchargera l'établissement des opérations de sécurité en vérifiant si ceux qui se présente sont bien des étudiant, de noter le nom de toutes les personnes qui se présenteront aux portes de la faculté, etc....

#### Fonctionnement

body-parser va nous permettre d'intercepter les requêtes et extraire puis "parser" ou segmenter le contenu du flux reçu (le `stream`) pour remplir req.body avec les champs attendu.

Concrêtement le middleware body-parser fonctionne comme suit et :

```
app.use(function( req, res, next ) {
    var data = '';
    req.on('data', function( chunk ) {
        data += chunk;
    });
    req.on('end', function() {
        req.rawBody = data;
        if (data && data.indexOf('{') > -1 ) {
        req.body = JSON.parse(data);
        }
        next();
    });
});
```

Notez que dans tous les middlewares, la fonction next() permet de transmettre le contrôle du flux au middleware suivant sinon à l'application.

#### express.json()

Notez que vu l'importance de ce module, Express a intégré depuis sa version 4.16.0 le middleware express.json()

```
// Version avec bodyParser
app.use(bodyParser.json({ type: '*/*' }))

// Version avec express.json()
app.use(express.json())
```

### morgan

Vu que nous allons mettre en place un serveur, il faut de préférence avoir un logger qui permettra d'avoir accès à toutes les requêtes selon plusieurs formats, il s'agit d'un middleware qui s'utilise comme suit `app.use(morgan(FORMAT DU LOG))`, par exemple:

```
app.use(morgan('short'))
```

#### Formats prédéfinis

imaginons que nous voulions accéder à l'adresse suivante: `http://localhost:3000/testMorgan` voici selon les formats prédéfinis le contenu des logs

* tiny: `POST /testMorgan 200 - - 17.179 ms`
* dev: `POST /testMorgan 200 21.699 ms - -`
* short: `::1 - POST /testMorgan HTTP/1.1 200 - - 19.586 ms`
* common (format Standard Apache common): `127.0.0.1 - - [20/Mar/2018:11:55:38 +0000] "POST /testMorgan HTTP/1.1" 200 -`
* combined  (format Standard Apache combined): `127.0.0.1 - - [20/Mar/2018:11:56:36 +0000] "POST /testMorgan HTTP/1.1" 200 - "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0"`

#### Format personalisé


Notez précédemment que POST désigne la méthode `:method`, /testMorgan représente l'url `:url` , le 200 est le code http de réponse appelé également le status `status`, ::1 représente l'adresse IP V6 `:remote-addr :remote-user` [etc](https://github.com/expressjs/morgan#tokens)...
Nous pouvons crée notre format de log personalisé
morgan(':method :url :status :res[content-length] - :response-time ms')

Faisons un test avec les lignes suivantes:

```
app.use(morgan(':date[clf]: Accès en :method sur :url avec le code :status répondu en :response-time ms'))
```

Nous obtenons le log suivant:

```
20/Mar/2018:14:04:27 +0000: Accès en GET sur /testMorgan avec le code
404 répondu en 4.173 ms
```

#### Options

Il également possible de modifier certaines options telle que:

 * immediate: pour avoir la requête au lieu de la réponse et donc d'avoir des logs en amont même si le serveur crash
 * stream: pour dire ou sera dirigé les logs, par défaut à "process.stdout"
 * skip: pour dire si l'on veut ignorer des messages, par defaut à "false" 

Ainsi nous pouvons pour les accès ayant un status [200](https://httpstatuses.com/200) en tiny, mais avoir plus d'information pour les accès non autorisée [401](https://httpstatuses.com/401), nous mettrons plutot ceci, en vous rappelant qu'il s'agit de l'option skip et donc pour l'afficher nous devons retourner false (d'ou l'utilisation de `!=` au lieu de `===`)

```
app.use(morgan('tiny', {
    skip: function (req, res) { return res.statusCode != 200 }
  }))
app.use(morgan('combined', {
    skip: function (req, res) { return res.statusCode != 401 }
  }))
```

Nous obtenons ceci

```
POST /testMorgan 200 - - 21.061 ms
127.0.0.1 - - [20/Mar/2018:12:15:32 +0000] "POST /unauthorized HTTP/1.1" 401 - "-" "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:59.0) Gecko/20100101 Firefox/59.0"
```
#### Sauvegarde des logs

En cas de problème il est toujours utile d'avoir sous la main le contenu des logs dont l'option `stream` est par défaut à `process.stdout` 
Il y a deux type de sauvegarde à savoir une sauvegarde normal et incrémentielle qui aura pour conséquent d'avoir un fichier de logs grandissant au fil du temps, ou alors une sauvegarde cyclique qui permet par exemple de ne garder que les logs du dernier mois ou d'avoir une taille limite de 1MegaBytes.

Vous êtes bien sur libre d'utiliser ce que vous voulez, mais il est conseillé d'avoir ce qu'on appelle un logrotate (rotation des logs), celui ci permet comme son nom l'indique, la rotation des fichiers de journaux (les logs) en supprimant les éléments anciens et également la compression. C'est le module rotating-file-stream qui va nous permettre de l'implémenter facilement.

### Rotating-file-stream

Rotating file stream va nous permettre de créer un stream en écriture, vous pouvez donc créer comme sur apache des fichiers de journaux d'accès normaux "access.log" ou encore regroupant les erreurs "error.log", le code final sera donc le suivant:

```
const morgan = require('morgan')
const fs = require('fs')
const rfs = require('rotating-file-stream')
const path = require('path')

var logDirectory = path.join(__dirname, 'log')

fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory)

var accessLogStream = rfs('access.log', {
    interval: '7d', // rotate weekly
    path: logDirectory,
    maxFiles: 10
  })

var errorLogStream = rfs('error.log', {
    interval: '7d', // rotate daily
    path: logDirectory,
    maxFiles: 30
  })

app.use(morgan('tiny', {
    skip: function (req, res) { return res.statusCode > 299 },
    stream: accessLogStream
  }))
app.use(morgan('combined', {
    skip: function (req, res) { return res.statusCode < 300 },
    stream: errorLogStream,
    compress: 'gzip' 
  }))
```

#### Ne pas tracker les logs par Git

Pour que Git ne suivent pas les fichiers de logs, il faut rajouter le nom du repertoire des journaux dans le fichier `.gitignore`

# Gestion des routes 

Nous avons vu précédemment que le serveur répondais à certaines méthodes pour certaines URL, c'est ce qu'on appelles les routes, nous allons extériorisés nos routes dans un fichiers à part à savoir: router.js
l'import et l'export se fera au format common js et non es6, notre version de node ne gérant pas encore 

## import et export
### Syntaxe ES6:
Dans nos modules fichier1.js nous ferons ceci

```
export function fnct1() {
  return 'fonction 1';
}

export function fnct2() {
  return 'fonction 2';
}
export default function fnct3() {
  return 'fonction 3';
}
```
Puis dans le fichier appelant nous ferons:

```
import autreNom, {fnct1, fnct2} from 'fichier1'

console.log(fnct1()) // Affiche : fonction 1
console.log(fnct2()) // Affiche : fonction 2
console.log(autreNom()) // Affiche : fonction 3
```

### Syntaxe Common JS


Dans nos modules fichier1.js nous ferons ceci

```
exports.fnct1 = function() {
    return 'fonction 1';
}

exports.fnct2 = function() {
    return 'fonction 2';
}

exports.fnct3 = function() {
    return 'fonction 3';
}
```
Puis dans le fichier appelant nous ferons:

```
const { fnct1, fnct2, fnct3 } = require('./fichier1')

console.log(fnct1()) // Affiche : fonction 1
console.log(fnct2()) // Affiche : fonction 2
console.log(fnct3()) // Affiche : fonction 3
```
#### Mixin module.exports et exports

Ici un mélange entre exports et module.exports serait plutot comme ci:

```
module.exports = () => 'fonction 3'
module.exports.fnct1 = () => 'fonction 1'
module.exports.fnct2 = () => 'fonction 2'
```
et au niveau du fichier appelant

```
const externe = require('./fichier1')

console.log(externe.fnct1()) // Affiche : fonction 1
console.log(externe.fnct2()) // Affiche : fonction 2
console.log(externe()) // Affiche : fonction 3
```

### Ecritures des Routes

Les routes sont simples, voici un exemple de routage basique avec express:

```
var express = require('express');
var app = express();

app.get('/', function(req, res) {
  res.send('Bienvenue');
});
```
L'[API](http://expressjs.com/fr/4x/api.html) d'express permet d'avoir accès accès à toutes les options possibles de requêtes et de réponses, Par exemple si nous voulions faire une sortes de raccourci simple

```
app.get('/google', (req, res) => {
    res.redirect(301, 'http://www.google.tn');
})
app.get('/youtube', (req, res) => {
    res.redirect(301, 'http://www.youtube.tn');
})
```

### Inventaires des routes

Il y aura des accès en:

* GET pour accéder à des pages publiques
* GET pour accéder a des pages protéger
* POST pour s'enregistrer
* POST pour s'authentifier

Nous aurons donc comme routes dans le fichier `router.js` les lignes suivantes:

```
module.exports = app => {
    app.get('/', (req, res) => res.sendStatus(200)) // OK
    app.get('/api', (req, res) => res.sendStatus(401)) // Unauthorized
    app.post('/signup', (req, res) => res.send('Sign Up'))
    app.post('/signin', (req, res) => res.send('Sign In'))

}
```

# Mise en place du schéma et du model

## Notion NoSQL

NoSQL ne veut pas dire, <strike>Pas de SQL</strike> mais plutot `SQL et autres` (Not Only SQL).
Pour comparer avec une base de données relationnels sachez d'abord qu'en Mo,goDB, le schema n'est pas statique mais dynamic, c'est à dire que d'une sauvegarde à une autre, si un élement venait à manquer, MongoDB ne le bloquera pas et permettra la sauvegarde, c'est à vous de faire ce controle en amont.
Voici une analogie SQL / MongoDB:

| SQL | MongoDB |
|---|---|
| Base de données  | Base de données |
| Table | Collection |
| Colonne | Field / Champ |
| Index | Index |
| Jointure | population ou inclusion directe (imbrication) |

Notez également qu'il existe un champ _id qui est l'identifiant de chaque document, l'ajout d'un index permet d'avoir des requêtes à la base de donnée traitées plus efficacement et sans avoir à analyser une collection. Il faut bien sur que cet index soit approprié, par exemple mettre comme index la date de naissance de la `collection` des étudiants, n'aurait aucune utilité

## Champs du schema

A présent nous allons discuter de l'utilisateur, ce dernier aura besoin de deux élements pour se connecter, cela peut être l'adresse email et un mot de passe ou un nom d'utilisateur et un mot de passe. Nous choisirons la seconde possibilité, en rajoutant deux élements, l'identifiant doit être unique et pour renforcer cette unicité, nous demanderons à ce que le nom d'utilisateur soit en minuscule pour éviter que deux utilisateurs aients les mêmes lettres comme:
admi, ADMIN, Admin, ADmIN, AdMiN, etc...

Une requête POST sur signup se comportera comme suit:
Si le nom d'utilisateur qui est unique, n'existe pas dans la base, alors nous le créons et nous ajoutons le mot de passe
Si celui ci existe ou qu'un des deux élements d'enregistrement n'est pas disponible, nous renseignons l'utilisateur avec le code status HTTP correspondant.

## Mise en place du schéma

Le schéma des utilisateurs sera décrit dans le fichier `models/user.js`:

```
const mongoose = require('mongoose')
const Schema = mongoose.schema

// Create Schema
const userSchema = new Schema({
    username:{
        type: String,
        unique: true,
        lowercase: true
    },
    password: String
})
```
Créons à présent le `model` qui permettra d'effectuer des opérations sur les documents d'une collections d'une base de données, comme des requetes de selection, d'insertion, de suppression et bien d'autres encore, puisqu'il existe également des hooks (ou point d'ancrage) qui permettent d'intervenir a tous les niveaux (avant et après) d'une requêtes (nous verrons cela lors du cryptage du mot de passe).
Le model est un constructeur 

```
// Create model
module.exports = mongoose.model('user', userSchema)
```

La collection sera automatiquement la version plurielle du nom du model, dans ce cas ci le nom est `user`, le nom de la collection sera `users`

# Implementation de l'enregistrement d'un nouvel utilisateur

## Modification des routes

Modifions notre dernière route pour qu'elle soit traité par l'action signup d'un nouveau controleur (le fichiers controllers/authentication.js) et signin par l'action signin comme suit:

```
exports.signin = (req, res, next) => {
    res.send("signin")
}
exports.signup = (req, res, next) => {
    res.send("signup")
}
```
puis dans notre router (`router.js`) modifions les lignes correspondantes
```
const Authentication = require('./controllers/authentication')
// ...
app.post('/signup',  Authentication.signup)
app.post('/signin',  Authentication.signin)
```

Vérifions à présent avec notre client Rest préféré que le résultat est bien celui escompté, c'est à dire afficher le nom de l'action en cours

## Récupération des identifiants
Modifions notre actions signup dans le controleur Authentification pour récupérer, les identifiants username et password, en nous rappelant de controler leur présence. Cette vérification peut être fait au niveau du schéma mais à quoi bon solliciter la base de donnée si ce contrôle peut être fait en amont.

```
exports.signup = (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    if (!username || !password)
        return res.status(422).send('Username and password are required')
    res.send({username, password})
}
```
Puis rajoutons l'accès à la base de données

## Installer et exécuter le serveur de base de données
Avant de continuer vous devez installer [mongoDB](https://www.mongodb.com/download-center?jmp=nav#community), une fois fait, vous devez configurer votre serveur qui consiste dans un premier temps à créer un repertoire qui contiendra le repertoire dédiée à la base de donnée, et celui dédié aux logs

```
mkdir d:\data\db
mkdir d:\data\log
```

puis exécuter votre serveur avec la commande suivante:

`mongod --dbpath "d:\data\db"`

ou tout simplement exécuter la commande `mongod` puisque par défaut mongo utilisera le répertoire \data\db du lecteur à partir duquel vous avez exécuter cette commande.

```
PS D:\labs\Authentication\test> mongod
2018-03-20T12:40:18.184-0700 I CONTROL  [initandlisten] MongoDB starting : pid=8224 port=27017 dbpath=D:\data\db\ 64-bit
2018-03-20T12:40:18.184-0700 I CONTROL  [initandlisten] targetMinOS: Windows 7/Windows Server 2008 R2
2018-03-20T12:40:18.184-0700 I CONTROL  [initandlisten] db version v3.6.2

// ...

2018-03-20T20:40:20.264+0100 I FTDC     [initandlisten] Initializing full-time diagnostic data capture with directory 'D:/data/db/diagnostic.data'
2018-03-20T20:40:20.352+0100 I NETWORK  [initandlisten] waiting for connections on port 27017

```
Vous remarquerez que parmi les messages affichés plusieurs informations permette de vous renseigner sur le fait qu'il ne répond aux requêtes que locales (sur la même machine) et vous informe sur les démarches à faire pour étendre le "bind" du serveur. il vous renseigne également sur le répertoire utilisé pour la base de donnée et finalement vous donne le port d'écoute qui est `27017`

Pour tester votre serveur il suffit sur une autre console lancer la commande mongo et exécuter quelques commandes comme suit:

```
PS D:\labs\Authentication\test> mongo
MongoDB shell version v3.6.2
connecting to: mongodb://127.0.0.1:27017
MongoDB server version: 3.6.2

// ...

> show dbs
admin    0.000GB
auth     0.000GB
config   0.000GB
blog     0.009GB
local    0.000GB
opendata 0.014GB
starter  0.000GB
stgm     0.001GB
sups     0.001GB
> use starter
switched to db starter
> show collections
user
> db.collection.user.find()
> db.user.find()
{ "_id" : ObjectId("5a84885077188b3004b67213"), "email" : "test1@example.com", "name" : "user1", "issued" : ISODate("2018-02-14T19:04:48.523Z"), "modified" : ISODate("2018-02-14T19:35:10.358Z") }
{ "_id" : ObjectId("5a84921841db8831709357d3"), "email" : "test2@example.com", "name" : "user2", "issued" : ISODate("2018-02-14T19:46:32.445Z"), "modified" : ISODate("2018-02-14T19:46:32.445Z"), "__v" : 0 }
{ "_id" : ObjectId("5a84925aebe97f08e01c37dc"), "email" : "test3@example.com", "name" : "user3", "issued" : ISODate("2018-02-14T19:47:38.773Z"), "modified" : ISODate("2018-02-14T19:47:38.773Z"), "__v" : 0 }
>
```

A présent créons un accàs à la base de données dans le fichier index.js

```
const mongoose = require('mongoose')

// @see: https://developer.mozilla.org/en-US/docs/Learn/Server-side/Express_Nodejs/mongoose
// DB Setup
//Set up default mongoose connection
const mongoDBURL = 'mongodb://127.0.0.1/apiServer';
mongoose.connect(mongoDBURL);
//Get the default connection
const db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
```

Si aucun message d'erreur ne s'affiche, c'est que la connection a reussit.

Ajoutons ces quelques lignes dans le controleur `authentication.js` à la fonction signup pour vérifier si un utilisateur existe, sinon il sera enregistré dans la collection `users`

```

exports.signup = (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    if (!username || !password)
        return res.status(422).send('Username and password are required')

        User.findOne({username}, (err, exist) => {
            if (err) { return next(err) }
            
            // If a user with user does exist, return an error
            if (exist){
                // 422 Unprocessable Entity
                return res.status(422).send({ error: 'Username already exist' })
            }
    
            // if a user with username does NOT exist, create new user document
            const user = new User({username, password})
    
            user.save(err => {
                if(err) { return next(err) }
                // Respond to request indicating the user was created
                res.json({ success: true, data: {username, password} })
            })
        })
}
```


Faisons notre test:
```
POST http://localhost:3000/signup 
Content-Type: application/json 
{
"username":"user1",
"password":"passe1"
}
```
nous recevons la réponse suivante:

```
{
  "success": true,
  "data": {
    "username": "user1",
    "password": "passe1"
  }
}
```

vérifions que l'utilisateurs a bien été ajouté via le shell mongo:

```
> use apiServer
switched to db apiServer
> db.users.find()
{ "_id" : ObjectId("5ab171ecddfe0c05c8529033"), "username" : "user1",
"password" : "passe1", "__v" : 0 }
>
```
Si l'on exécute la même opération signup en POST avec le même contenu nous obtenons:

```
{
  "error": "Username already exist"
}
```
Donc tout est fonctionnel, mise à part une petite remarque assez génante, concernant le mot de passe, celui ci est sauvegardé en claire, nous allons pour remédier à cela utiliser le module `bcrypt-nodejs`

# Cryptage du mot de passe avant sauvegarde

### bcrypt-nodejs

Le module [bcrypt-nodejs](https://www.npmjs.com/package/bcrypt-nodejs) va nous permettre de crypter notre mot de passe mais également de le comparer.
En effet lors de la connexion, nous ne décryptons jamais un mot de passe mais nous cryptons celui proposé et vérifions qu'il correspond au mot de passe crypté; nous y reviendrons en temps voulu ...
Remarque: Un module appelé [bcrypt](https://www.npmjs.com/package/bcrypt) permet de faire la même chose, vous êtes libre de l'utilisez si vous l'avez déjà intégrer dans votre projet.
Notez que la raison pour laquelle `bcrypt-nodejs` a été crée est le nombre de dépendance du module `bcrypt`, d'après le créateur de bcrypt-nodejs, sa version qui n'a aucun dépendance, permettrais d'éviter de télécharger plus de 1.6GB de dépendances.

### Cryptage du mot de passe et mongoose hook

Nous n'allons rien changé à la logique apparente du controleur `Authentication`, nous allons utiliser un hook au niveau de mongoose.
Pour chaque action il existe deux hooks, `pre` et `post`. "pre" permet de rajouter un traitement avant exécutions d'une commande et "post" permet d'exécuter un traitement après exécution d'une commande.

Rendons nous dans notre description du model `user.js` et ajoutons notre hook en précisant qu'il ne faut SURTOUT PAS UTILISER LES FONCTIONS AVEC LA SYNTAXE ARROW,
Rappelez vous que les fonctions fléchées ne possède pas les valeurs propres de `this`, `arguments`, `super` ou `new.target`.

soit le contenu ajouté (et remarquez l'utilisation de `this`, précédemment citée):

```
const bcrypt = require('bcrypt-nodejs')

userSchema.pre('save', function(next) {
    const user = this
    bcrypt.genSalt(10, (err, salt) => {
        if(err) {return next(err)}
        bcrypt.hash(user.password, salt, null, (err, hash) => {
            if(err) {return next(err)}

            user.password = hash
            next()      
        })
    })
  });

```

Testons l'enregistrement d'un nouvel utilisateur et observons le document crée dans la collection `users`:

```
POST http://localhost:3000/signup 
Content-Type: application/json 
{
"username":"user2",
"password":"passe2"
}
```

soit le contenu de la collection:

```
> db.users.find()
{ "_id" : ObjectId("5ab171ecddfe0c05c8529033"), "username" : "user1",
"password" : "passe1", "__v" : 0 }
{ "_id" : ObjectId("5ab17abdb971012e983ef838"), "username" : "user2",
"password" : "$2a$10$deFit.7iLENF1ab9lsQbI./HfIsux6MpOQTJmbNUvrE9n7eT7P9xO", "__v" : 0 }
>
```

On constate que le mot de passe est bien crypté

# Mise en place d'un token JWT
## Principe des tokens JWT
Il est inconcevable de demander à un utilisateur de se reconnecter à chaque accès à une zone protégé. Autrefois, lorsqu'un utilisateur se connecter, un identificateur de session était généré puis sauvegardé sur le serveur. Ensuite un cookie contenant ce sessionID était placé sur la machine cliente, lorsque l'utilisteur se deconnecte, la session est détruite. Le principale problème des cookies est qu'ils ne sont pas multidomaines. Ce qui n'est pas le cas des token et plus précisement des JWT (JSON Web Token) qui sont normalisés par le RFC 7519.

L'authentification basé sur les tokens via les JWT, veut que l'ont envoi le JWT avec chaque requête, le serveur n'a aucune requête à faire, mais juste et simplement valider le token.
Le format d'un jeton est `header.payload.signature`, l'entête contient le type de token (JWT) et l'algorithme de cryptage utilisé, les champs utilisés dans le payload (les données ou data)sont normalisés, vous pouvez en rajouter quelques uns mais rapellez vous qu'ils seront envoyés avec chaque requête (faites donc attention à la taille du token). Les informations sont encodées via l'algorithme précisé dans le header et une clé secrète (voir plus bas le pseudo-code proposé)

Un jeton avec comme entête:

```
{
  "typ": "JWT",
  "alg": "HS256"
}
```
et payload suivant (sub veut dire subject ou identifiant et iat "issued at")
```
{
  "sub": "5aaf868bc5d72626ec9466eb",
  "iat": 1521452683906
}
```
pour la signature
```
HMACSHA256(
  base64UrlEncode(header) + "." +
  base64UrlEncode(payload),
  
) secret base64 encoded
```
La signature consiste en se pseudo code:

```
data = base64urlEncode( header ) + “.” + base64urlEncode( payload )

signature = Hash( data, secret );
```

on obtient le jeton suivant:
`eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1YWFmODY4YmM1ZDcyNjI2ZWM5NDY2ZWIiLCJpYXQiOjE1MjE0NTI2ODM5MDZ9.3WWez1kwpSvkGkOAe10l_oitweVRzu_PJ5g0iGcORE4`

Vous pouvez tester ce code pour vérifier que la première partie représente bien le résultat du code suivant:


Notez bien que dans le payload vous ne devez jamais mettre d'informations sensibles, le cas échéant, vous devriez au lieu d'utiliser JWS (JSON Web Signature), penser à utiliser JWE (JSON Web Encryption).
Les JWR peuvent être joint aux flux d'API suivants:

* REST
* SOAP

Notez enfin qu'un token au niveau du client peut aussi bien être sauvegardé dans un cookie dont la taille est limités sur votre stockage local via web storage d'HTML
Notez que nous ne verrons pas cette partie puisque nous sommes dans ce cas de figure du coté du serveur

## Implémentation de JWT

Dans un premier temps préparons la clé secrète que nous mettrons dans un fichier à part (config.js)
le contenu du fichier sera comme suit:

```
module.exports = {
    secret = 'YOUR_SUPER_SECRET_KEY_USED_FOR_HASHING_SIGNATURE'
}
```

### Notions basiques sur HMAC et RSA
il est généralement préférable que cela soit une chaine de caractère de 128bits, par défaut l'algorithme utilisé est le HS256, les algorithmes supportés étant HS256, HS384, HS512 et RS256
HS est l'acronyme pour `HMAC SHA` (Hashage cryptographique d'un message en utilisant une clé secrète) alors que RS est l'acronyme pour `RSA SHA` (cryptographie asymétrique). Notez également que SHA veut dire Secure Hash Algorithm

La chaine résultante est appelé empreinte en cryptographique; Ce sont des condensé de taille fixe, une fonction de hashage à sens unique est une fonction qui ne permet pas à partir de l'empreinte, d'avoir la chaine initiale
De même une fonction de hashage sans collision est une fonction qui assure que deux chaines initiales n'ont pas la même empreinte.
Cela permet donc de garantir que si un attaquant obtient un fichier de mot de passe hashé, il ne pourra jamais récupérer le mot de passe d'origine. Dans le cas de HMAC, l'empreinte dépend à la fois de l'entrée et de la clef, elle est dans ce cas utilisé avec SHA-256 (ou 384 ou encore 512). Dans le cas d'une utilisation RSA ou il y a une clé publique et une autre privée, le serveur peut crypter le token avec sa clé privée

### Création du token
Nous allons utilisé le module `jwt-simple` qui va nous permettre de calculer notre token. Nous utiiserons conformément à la norme les champs sub et iat. Dans le champs sub nous mettrons l'objectID de l'utilisateur et dans iat, la date de génération du token. soit donc le contenu du contrôleur d'authentification:

```
const jwt = require('jwt-simple')
const User = require('../models/user')
const config = require('../config')


function generateToken(user){
    const timestamp = new Date().getTime()
    return jwt.encode({ sub: user.id, iat: timestamp }, config.secret)
}

exports.signin = (req, res, next) => {
    res.send({ token: generateToken(req.user)})
}
exports.signup = (req, res, next) => {
    const username = req.body.username
    const password = req.body.password
    if (!username || !password)
        return res.status(422).send('Username and password are required')

        User.findOne({username}, (err, exist) => {
            if (err) { return next(err) }
            
            if (exist){
                return res.status(422).send({ error: 'Username already exist' })
            }
    
            const user = new User({username, password})
    
            user.save(err => {
                if(err) { return next(err) }
                res.send({ token: generateToken(user)})
            })
        })
}
```

Rappelez vous que dans le cas d'une authentification (signin) ou d'un enregistrement (signup) le serveur utilisera la fonction ci dessus pour envoyer au client son token. La vérification du token se fera via passport et plus précisément la stratégie jwt.
Notez que nous reviendrons sur la fonction signin plus tard

# Rappel sur le flux d'authentification

Rappelons les différentes méthodes d'accès

## INSCRIPTION
* L'utilisateur envoi ses informations d'identification
* Si l'utilisateur n'existe pas dans la base alors il est crée avec un mot de passe crypté via bcrypt
* On retourne un Token signé avec la clé secrète du serveur

## CONNEXION
* L'utilisateur envoi ses informations d'identification
* On utilise Passport et la stratégie local (couple username et password) pour vérifier l'identité de l'utilisateur
* Le mot de passe soumis est crypté avec bcrypt et comparé avec le mot de passe en base de données
* Si l'utilisateur est bien celui qu'il prétend être, on retourne un Token signé avec la clé secrète du serveur

## ACCESS SECURISE
* L'utilisateur envoi avec sa requête, le token reçu par le serveur
* On utilise Passport et la stratégie JWT pour vérifier le token en se basant sur la clé secrète du serveur
* Si le token est valide, l'utilisateur a accès à la ressource protégé

Il est donc claire que nous devons passer à l'implémentation de Passport

# Installation et configuration de passport et passport-jwt

# Implementation de stratégies passport

# Comparaison d'un mot de passe en clair et d'un mot de passe crypté

# Implementation de l'authentification
