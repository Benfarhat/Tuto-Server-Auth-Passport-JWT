# Mise en place d'un serveur Authentifié

Nous nous proposons dans ce tutoriel la mise en place pas à pas dans un premier temps d'un serveur d'API RESTs (REpresentational State Transfer) authentifié. Nous ajouterons dans une seconde étape la mise en place d'une serveur GraphQL


- [Mise en place d'un serveur Authentifié](#mise-en-place-dun-serveur-authentifi%C3%A9)
    - [Préparation du serveur](#pr%C3%A9paration-du-serveur)
    - [Modules utilisés pour le serveur](#modules-utilis%C3%A9s-pour-le-serveur)
        - [Express js](#express-js)
            - [Requêtes, méthodes et endpoint](#requ%C3%AAtes-m%C3%A9thodes-et-endpoint)
            - [Un mot sur le routage](#un-mot-sur-le-routage)
            - [Notion de Middleware](#notion-de-middleware)
            - [La fonction next()](#la-fonction-next)
            - [Gestion des erreurs (Error handling)](#gestion-des-erreurs-error-handling)
            - [Exemples concrets avec Express](#exemples-concrets-avec-express)
        - [Body Parser](#body-parser)
            - [Fonctionnement](#fonctionnement)
            - [express.json()](#expressjson)
        - [morgan](#morgan)
            - [Formats prédéfinis](#formats-pr%C3%A9d%C3%A9finis)
            - [Format personalisé](#format-personalis%C3%A9)
            - [Options](#options)
            - [Sauvegarde des logs](#sauvegarde-des-logs)
        - [Rotating-file-stream](#rotating-file-stream)
            - [Ne pas tracker les logs par Git](#ne-pas-tracker-les-logs-par-git)
- [Gestion des routes](#gestion-des-routes)
    - [import et export](#import-et-export)
        - [Syntaxe ES6:](#syntaxe-es6)
        - [Syntaxe Common JS](#syntaxe-common-js)
            - [Mixin module.exports et exports](#mixin-moduleexports-et-exports)
        - [Ecritures des Routes](#ecritures-des-routes)
        - [Inventaires des routes](#inventaires-des-routes)
- [Mise en place du schéma et du model](#mise-en-place-du-sch%C3%A9ma-et-du-model)
    - [Notion NoSQL](#notion-nosql)
    - [Principe](#principe)
    - [Champs du schema](#champs-du-schema)
    - [Mise en place du schéma](#mise-en-place-du-sch%C3%A9ma)
- [Implementation de l'enregistrement d'un nouvel utilisateur](#implementation-de-lenregistrement-dun-nouvel-utilisateur)
    - [Modification des routes](#modification-des-routes)
    - [Récupération des identifiants](#r%C3%A9cup%C3%A9ration-des-identifiants)
    - [Installer et exécuter le serveur de base de données](#installer-et-ex%C3%A9cuter-le-serveur-de-base-de-donn%C3%A9es)
- [Cryptage du mot de passe avant sauvegarde](#cryptage-du-mot-de-passe-avant-sauvegarde)
        - [bcrypt-nodejs](#bcrypt-nodejs)
        - [Cryptage du mot de passe et mongoose hook](#cryptage-du-mot-de-passe-et-mongoose-hook)
- [Mise en place d'un token JWT](#mise-en-place-dun-token-jwt)
    - [Principe des tokens JWT](#principe-des-tokens-jwt)
    - [Implémentation de JWT](#impl%C3%A9mentation-de-jwt)
        - [Notions basiques sur HMAC et RSA](#notions-basiques-sur-hmac-et-rsa)
        - [Création du token](#cr%C3%A9ation-du-token)
- [Rappel sur le flux d'authentification](#rappel-sur-le-flux-dauthentification)
    - [INSCRIPTION / REGISTER](#inscription-register)
    - [CONNEXION / LOGIN](#connexion-login)
    - [ACCESS SECURISE](#access-securise)
- [Installation et configuration de passport et passport-jwt](#installation-et-configuration-de-passport-et-passport-jwt)
        - [Sessions](#sessions)
        - [Stratégies](#strat%C3%A9gies)
    - [La stratégie passport local](#la-strat%C3%A9gie-passport-local)
        - [Comparaison d'un mot de passe en clair et d'un mot de passe crypté](#comparaison-dun-mot-de-passe-en-clair-et-dun-mot-de-passe-crypt%C3%A9)
        - [Implémentation finale de la stratégie locale](#impl%C3%A9mentation-finale-de-la-strat%C3%A9gie-locale)
    - [La stratégie passport jwt](#la-strat%C3%A9gie-passport-jwt)

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

Pour ceux qui ne le savent pas, une adresse IP (IP pour Internet protocole à comprendre "en langage Internet") est un identifiant d'ordinateur qui dans le cas des adresses IP dite V4 est formée de 4 numéros séparés par un point, chaque numéro pouvant aller de 0 à 255 (donc pas d'adresse du genre 5.10.3.<strike>400</strike>), Internet aurait du mal a fonctionner sans ces identifiants. Nous ne les voyons pas car nous utilisons une sortes de format plus simple à apprendre comme pour nos téléphones, le repertoire interne de nos smartphones nous permet d'éviter le supplice d'apprendre des centaines de suites de chiffres. Dans le cas de l'Internet, les numéros de téléphones sont nos adresses IP, les noms de no contacts sont les adresses URL (du genre www.google.com) et le repertoire sont les serveurs DNS (Domaine Name Server) qui font la correspondance entre une adresse URL et une adresse IP

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

#### Requêtes, méthodes et endpoint

Ouvrons une lègre parenthèse en rappelant qu'il existe deux parties distinctes, celui qui demande une ressource (le `client`) et celui qui répond aux demandes (le `serveur`). Rappelez vous que dans ce tuto, nous développons notre serveur et sa façon de répondre aux demandes des utilisateurs.
La demande est appelée requête (`request`) et la réponse tout simplement réponse (`response`).

Lorsqu'on agit sur une `ressource` un seul élément est appelé `objet`, alors qu'un ensemble d'objets est nommé `collection`. Vis à vis de ces objets ou collections, il y a plusieurs intéractions possibles, voulons nous la consulter, la modifier, la supprimer, accéder à une objet ou toute la collection. cette information est possible dans le protocole HTTP grace aux `méthodes`. Mais la méthode en elle même ne sert pas à grand chose, c'est comme si on se présentais à la caisse d'un épicier et qu'on dise "donnez moi", l'épicier vous demandera forcément "quoi". Pour accéder à une ressources ou une collection il faut ajouter à la méthode  un point de connection `endpoint` appelé `URI` (Uniform Resource Identifier)

| Méthodes | Opération | ressource | exemple de endpoint |
|---|---|---|---|
| GET | Lire / Lister | Collection | GET /users |
| GET | Lire | Objet | GET /users/123 |
| POST | Créer | Collection | POST /users |
| PUT | Modifier entièrement | Objet | PUT /users/123 |
| PATCH | Modifier partiellement | Objet | PATCH /users/123 |
| DELETE | Supprimer | Objet | DELETE /users/123 |

#### Un mot sur le routage

Express nous permet de faciliter le traitement des requêtes grace au routage qui permet de dire pour chaque type de requête quelle fonction (handler en anglais) s'occupera de son traitement

le format sera on ne peut plus simple:

`APP.METHODES(ENDPOINT, HANDLER)`

#### Notion de Middleware

Il faut savoir qu'Express est un framework fonctionnel mais qui offre le juste minimal requis. Pour des opérations qui sortent du contexte du fonctionnement normal d'express (nous le verrons plus loin), il est possible d'insérer un module au milieu qui permet de faire un traitement en amont. Par exemple à l'entrée d'une grande banque, vous passerez par un premier portail dit de sécurité ou on vérifiera votre identité, si tout est en règle et après avoir noté l'heure de votre arrivée, vous passerez au second portail, par exemple celui de l'accueil qui vérifiera l'heure de votre rendez-vous, vous orientera et pourra éventuellement vérifier que vous avez bien tous les papiers necessaires pour le traitement de votre requête et les arrengera de manière a ce que le dossier soit présentable; Ensuite, vous pourrez accèder au bureau qui traitera réellement votre demande. Les deux premiers portails sont des middlewares, qui vu comme ca, ils semblent pénible, mais dites vous que ces middlewares offrent une grosse valeur ajoutée à la société (sécurité et organisation) mais également aux visiteurs (qui grace a se système se sentira également en sécurité et évitera les longues files d'attentes).  

#### La fonction next()

Plusieurs middleware successifs sont appelés pile (ou stack en anglais), lors de l'utilisation d'un middleware on a besoin de 3 paramètres:
* La requête
* La réponse
* La fonction middleware suivante

les paramètres peuvent avoir n'importe quel nom (valide bien sur), le premier est par convention nommé `req`, le second `res` et le troisième `next`
Lorsqu'on appelle la fonction next() 
Par exemple un simple middleware qui enregistrerais les connexions serait comme ceci

```

var express = require('express');
var app = express();

var enregistreConnection = function (req, res, next) {
    console.log(`connexion detecté à partir de l'ip: ${req.ip} avec la méthode ${req.method}`);
    next();
};

var secondeMiddleware = function (req, res, next) {
    console.log('Je suis le seconde Middleware!');
    next();
};


app.use(enregistreConnection);
app.use(secondeMiddleware);

app.get('/', function (req, res) {
  res.send('Hello World!');
});

app.listen(3000);


```
En exécutant la commande curl (abréviation de Client URL Request Librairie) suivante: `curl -X GET -i 'http://127.0.0.1:3000'` (qui équivaut à consulter avec votre navigateur l'URL `http://127.0.0.1:3000`) on obtient sur la console du serveur les messages suivants:

```
connexion detecté à partir de l'ip: 127.0.0.1 avec la méthode GET
Je suis le seconde Middleware!
```

Par contre si on enlève l'appel à la fonction next dans le premier middleware il n'y aura pas de passage aux middlewares suivants et seule la première ligne sera affichée.

#### Gestion des erreurs (Error handling)

Si un quatrième paramètre est appelé alors ce parmaètre représentera les éventuels erreurs, et se positionnera à la première position, nous aurons alors:

```
app.use((err, req, res, next) => {

})
```
Le traitement des erreurs doit être au niveau du dernier middleware comme suit:

```
  var premierMiddleware = function (req, res, next) {
    throw new Error('Une erreur est survenue!')
    next();
  };
  
  var secondeMiddleware = function (err, req, res, next) {
    console.log(err);
    next();
  };
  
  
  app.use(premierMiddleware);
  app.use(secondeMiddleware);
```

Lors de l'accès à la racine nous obtenons les messages d'erreurs:

```
connection to mongodb://127.0.0.1/apiServer succesful
Error: Une erreur est survenue!
    at premierMiddleware (index.js:54:11)
    at Layer.handle [as handle_request] (\node_modules\express\lib\router\layer.js:95:5)
    ...
```

#### Exemples concrets avec Express

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


#### Fonctionnement

body-parser est un middleware qui va nous permettre d'intercepter les requêtes et extraire puis "parser" ou segmenter le contenu du flux reçu (le `stream`) pour remplir req.body avec les champs attendu.

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

Vu que nous allons mettre en place un serveur, il faut de préférence avoir un logger (journal d'évènements) qui permettra d'avoir accès à toutes les requêtes selon plusieurs formats, il s'agit d'un middleware qui s'utilise comme suit `app.use(morgan(FORMAT DU LOG))`, par exemple:

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

Faisons un test avec le format suivant:

```
app.use(morgan(':date[clf]: Accès en :method sur :url avec le code :status répondu en :response-time ms'))
```

Nous obtenons ce message de log:

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

Nous allons extériorisés nos routes dans un fichiers à part à savoir: router.js
l'import et l'export se fera au format common js et non es6, notre version de node ne gérant pas encore la nouvelle syntaxe des imports

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

Pour cela nous allon utilisé MongoDB et comme module, l'incontournable mongoose pour lequel certaines doit être connues:

* Schema: Le schéma permet de décrire les types de données, les contraintes (unique, minuscule, requis) et les élèments de validation. Tout ceci se passe à un niveau applicatif puisque mongoDB n'a aucun soucis, en effet comme nous le verrons à la prochaine sous section, MongoDB a un schéma flexible et dynamique d'une enregistrement à un autre, il peut y avoir des champs complétement différents,
* Model: Le modèle va nous permettre en nous basant sur le schéma  défini, de faire des requêtes dans MongoDB, si une collection n'existe pas (ou une base de donnée), la collection (et éventuellement la base de données) sera créer lors de la première insertion,
* Document: Lorsqu'un objet est crée ou requêté via une instance du modèle, on parle de document, par exemple lors de l'insertion d'un nouvel utilisateur dans la collection "users", l'utilisateur a insérer avec toutes ses propriétés est appelé "document".

## Notion NoSQL

NoSQL ne veut pas dire, <strike>Pas de SQL</strike> mais plutot `SQL et autres` (Not Only SQL).
Pour comparer avec une base de données relationnels sachez d'abord qu'en MongoDB, le schema n'est pas statique mais dynamic, c'est à dire que d'une sauvegarde à une autre, si un élement venait à manquer, MongoDB ne le bloquera pas et permettra la sauvegarde, c'est à vous de faire ce controle en amont.
Voici une analogie entre un système de base de données relationnelle (RDBMS) et MongoDB:

| RDBMS | MongoDB |
|---|---|
| Base de données  | Base de données |
| Table | Collection |
| Tuple | Document |
| Champ | propriété |
| Index | Index |
| Jointure | population ou inclusion directe (imbrication) |

Notez également qu'il existe un champ _id qui est l'identifiant de chaque document, l'ajout d'un index permet d'avoir des requêtes à la base de donnée traitées plus efficacement et sans avoir à analyser une collection. Il faut bien sur que cet index soit approprié, par exemple mettre comme index la date de naissance de la `collection` des étudiants, n'aurait aucune utilité

## Principe 

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

Notez qu'il vous est possible de rajouterun message d'erreur a chaque restriction non respecté comme suit:
```
// ...
const userSchema = new Schema({
    username:{
        type: String,
        unique: [true, 'Cet identifiant existe déjà']
// ...
```
Plus d'infos sont disponible [ici](http://mongoosejs.com/docs/validation.html)

Créons à présent le `model` qui permettra d'effectuer des opérations sur les documents d'une collections d'une base de données, comme des requetes de selection, d'insertion, de suppression et bien d'autres encore, puisqu'il existe également des hooks (ou point d'ancrage) qui permettent d'intervenir a tous les niveaux (avant et après) d'une requêtes (nous verrons cela lors du cryptage du mot de passe).
Le model est un constructeur 

```
// Create model
module.exports = mongoose.model('user', userSchema)
```

La collection sera automatiquement la version plurielle du nom du model, dans ce cas ci le nom donné au model étant `user`, la collection se nommera `users`

# Implementation de l'enregistrement d'un nouvel utilisateur

## Modification des routes

Modifions notre dernière route pour qu'elle soit traitée par l'action signup d'un nouveau controleur (le fichiers `controllers/authentication.js`) et signin par l'action signin comme suit:

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
Modifions notre action signup dans le controleur Authentification pour récupérer les identifiants username et password, en vérifiant d'abord qu'ils ont bien été renseignés. Cette vérification peut être fait au niveau du schéma mais à quoi bon solliciter la base de donnée si ce contrôle peut être réalisé en amont.

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

Remarque: Lors de la mise en place de votre serveur et le déploiement de votre application en production, de nombreuses opérations simples lors de l'installation vous seront demandées, comme par exemple l'ajout du dépot officiel (cas de ubuntu / debian) ou encore et surtout demander au service mongod de s'exécuter automatiquement lors du démarrage du serveur via la commande `systemctl`.

Pour tester votre serveur il suffit sur une autre console lancer la commande mongo qui permet d'exécuter un shell javascript interactif appellé `mongo shell` et qui offre de nombreuses commandes dont les suivantes:

| Commandes | fonctionnement |
|---|---|
| show dbs (ou sh dbs) | affiche la liste des bases de données |
| use db1 | permet de se connecter à la base db1 |
| db | affiche la base de données courante (sur laquelle nous sommes connectée) |
| show collections | permet d'afficher les collections de la base courante |
| db.collection1.find() | Affiche le contenu de la collection "collection1" |
| db.collection1.find().pretty()) | même commande que la précédente mais avec un affiche plus "friendly" |
| db.collection1.insert({username: 'test', password:'pwd'}) | permet d'inséré dans la collection "collection1" le document composé des champs "username" et "password" ainsi que de leur valeur |
| db.collection1.find({ username: 'test1' }) | recherche dans la collection "collection1" de la base de donnée courante, le (ou les) document(s) ayant pour valeur de champ username "test1" |
| db.collection1.renameCollection("col1") | Renomme la collection "collection1" en "col1" |
| db.collection1.drop() | Supprime la collection "collection1" |
| db.dropDatabase() | Supprime la base de données courante |
| db.col1.find().sort({ username: 1 }) | Trie les documents de la collection "col1" en se basant sur le champ "username" |
| db.col1.createIndex({ username: 1 }) | le champ "username" de la collection "col1" devient un index |
| db.col1.getIndexes() | Fournit la liste des indexes de la collection "col1" |
| db.serverStatus() | offre un ensemble d'informations sur le serveur |
| db.serverStatus().storageEngine | renseigne sur le moteur de stockage utilisé |

ET... cerise sur le gateau, puisque c'est un shell javascript, vous pouvez écrire des commandes proche du javascript comme celle ci:

```
> db.user.find().map(u => {return u.country})
[ "tunisia", "spain", "canada", "france", "france" ]
```
La liste des commandes disponibles est fournie en ajoutant `help()` au point recherché comme par exemple:

`db.user.find().help()`

A présent que nous avons vu quelques commandes, utilisons quelques une pour tester le fonctionnement de notre serveur. Noter qu'il existe un outil graphique simple d'utilisation appelé [Robo 3T](https://robomongo.org/download) (anciennement appelé robomongo)

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
Notez que nous retrouvons le fameux next qui rappelons le est un nom choisis par convention qui permet de dire "poursuit ton chemin avec les changement que j'ai apporté".
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

## INSCRIPTION / REGISTER
* L'utilisateur envoi ses informations d'identification
* Si l'utilisateur n'existe pas dans la base alors il est crée avec un mot de passe crypté via bcrypt
* On retourne un Token signé avec la clé secrète du serveur

## CONNEXION / LOGIN
* L'utilisateur envoi ses informations d'identification
* On utilise Passport et la stratégie local (couple username et password) pour vérifier l'identité de l'utilisateur
* Le mot de passe soumis est crypté avec bcrypt et comparé avec le mot de passe en base de données
* Si l'utilisateur est bien celui qu'il prétend être, on retourne un Token signé avec la clé secrète du serveur

## ACCESS SECURISE
* L'utilisateur envoi avec sa requête, le token reçu par le serveur
* On utilise Passport et la stratégie JWT pour vérifier le token en se basant sur la clé secrète du serveur
* Si le token est valide, l'utilisateur a accès à la ressource protégé

Nous avons fini la partie inscription  il nous reste a sécurisé les deux routes restantes

# Installation et configuration de passport et passport-jwt

Dans le fichier router.js nous allons insérer l'appel à passport qui se résume à appelé passport.authenticate(à et de spécifier quelle stratégie vous voulez utiliser et éventuellement ajouter quelques configurations.

### Sessions

Les sessions sont intéréssantes lorsqu'un utilisateur accède à un site via un navigateur, mais dans le cas d'un serveur API, les sessions sont inutiless donc nous les désactiveront


### Stratégies

Les stratégies passport sont des packages qui permettent de dire comment s'authentifier. il existe plusieurs centaines de stratégie, dont les plus connues sont: 

* Local (en utilisant la combinaison de deux élements comme c'est le cas ici avec le username et le mot de passe)
* jwt (avec l'utilisation de jeton)
* Google
* Facebook
* Twitter
* Github

Tout le monde peut faire sa propre stratégie et la publier si elle est susceptible d'être utilisée par le public, on trouve des stratégies pour des solutions comme IBM, spotify, mailchimp, mixcloud, cisco, slack, ...
Pour cela le module passport-strategy offre une API permettant d'en créer, notez qu'une stratégie a un nom par défaut, dans notre cas nous utiliserons local et jwt, mais il est possible de les renommer en utilisant un nom optionnel, en effet pour chaque stratégie il faut réecrire la méthode authenticate et déecrire le mécanisme d'authentification. Si jamais pour une même stratégie (par exemple locale) vous désirez avoir deux types d'authentification (disons un qui se base sur l'adresse email et qui avant vérifie si l'email est valide et un autre qui se base sur le username avec un mot de passe qui au lieu d'utiliser un hashage Bcrypt utiliserais une solution propriétaire), alors vous pourrez dans ce cas, bien que vous utilisiez la même stratégie de base, modifier le nom par défaut pour les différencier lors de l'appel.
Il est intéréssant de connaitre les méthodes suivante:

* Strategy.success(user, info): Pour authentifier l'utilisateur avec succès
* Strategy.fail(challenge, status): Pour faire échouer une authentification (status à 401) à utiliser par exemple si l'accès se fait via une adresse ip bannie.
* Strategy.redirect(url, status): Pour rediriger faire un système d'authentification tierce (status à 302)
* Strategy.pass(): Pour court-circuiter l'authentification dans le cas ou par exemple la session d'authentification est encore valide
* Strategy.error(err): A utiliser en cas d'erreur

conformément à ce qui a été dit voici nos nouvelles routes:

```
const Authentication = require('./controllers/authentication')

module.exports = app => {
    app.get('/', (req, res) => res.sendStatus(200)) // OK
    app.post('/signup',  Authentication.signup)
    app.post('/signin', passport.authenticate('local', { session: false }),  Authentication.signin)
    app.get('/api', passport.authenticate('jwt', { session: false }), (req, res) => res.send("Secured Area")) // Unauthorized
}
```

A présent nous devons décrire nos deux stratégies: "local" et par token web json ("jwt")

## La stratégie passport local
Nous allons mettre nos stratégies dans le fichier `services/passport.js`, commençons par la stratégie locale pour l'accès à la méthode `Authentication.signin`

```
const passport = require('passport')
const LocalStrategy = require('passport-local') 
const User = require('../models/user')

const localLogin = new LocalStrategy(function(username, password, done) {
    console.log(username, password)
    // Notre logique d'authentification
    return done(null, false)
})
```

Il est possible par exemple de changer les champs par défaut (cas ou à la place de username nous avons email)

```
const passport = require('passport')
const LocalStrategy = require('passport-local') 
const User = require('../models/user')

const localOptions = {
    usernameField: 'email', // default to 'username'
    passwordField: 'password' // default to 'password'
}

const localLogin = new LocalStrategy(localOptions, function(email, password, done) {
    console.log(email, password)
    return done(null, false)
})
```
A présent, notre logique consiste à faire ceci:

1. Verifier dans la base de donnée si l'utilisateur existe
    * Si non on retourne false
    * Si oui on continue
2.  Comparer le mot de passe en base de donné avec la version cryptée du mot de passe proposé
    * Si ca ne correspond pas on retourne false
    * Si cela correpond on retourne l'utilisateur

### Comparaison d'un mot de passe en clair et d'un mot de passe crypté

Pour comparer les mots de passe, nous allons rajouter une méthode au model User dans laquel nous utiliserons tout simplement la méthode [compare](https://www.npmjs.com/package/bcrypt#to-check-a-password) de bcrypt, nous avons donc dans `models/use.js`

```
userSchema.methods.comparePassword = function(candidatePassword, callback) {

    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) { return callback(err) }
        return callback(null, isMatch)
    })
}
```

### Implémentation finale de la stratégie locale

A présent voici le code complet pour l'authentification avec stratégie locale

```
const localLogin = new LocalStrategy((username, password, done) => {
    // On vérifie si l'utilisateur existe
    User.findOne({ username }, (err, user) => {
        // Si il y a une erreur
        if (err) { return done(err, false) }

        // Si l'utilisateur n'existe pas
        if(!user) {
            done(null, false)
        } else {
            // Si il exise on compare les mot de passe
            user.comparePassword(password, function(err, isMatch) {
                // Si il y a une erreur
                if(err) { return done(err) }
                // Si le mot de passe ne correspondent pas
                if(!isMatch) { return done(null, false) }

                // Sinon tout est ok!
                return done(null, user)
            })
        }
    })

})

```

## La stratégie passport jwt

Dans `services/passport.js`, nous allons ajouter la stratégie jwt en utilisant JwtStrategy qui fonctionne avec des options dont les plus intéressantes sont:

* secretOrKey est une chaîne ou un tampon contenant la clé publique secrète (symétrique) ou codée PEM (asymétrique) pour vérifier la signature du jeton. OBLIGATOIRE sauf si secretOrKeyProvider est fourni.
* secretOrKeyProvider est un rappel dans la fonction de format secretOrKeyProvider (request, rawJwtToken, done), qui doit être fait avec une clé publique secrète ou codée PEM (asymétrique) pour la combinaison donnée de clé et de requête. done accepte les arguments dans la fonction de format done (err, secret). Notez que c'est à l'implémenteur de décoder rawJwtToken. OBLIGATOIRE sauf si secretOrKey est fourni.
* jwtFromRequest (OBLIGATOIRE) Fonction qui accepte une requête comme seul paramètre et renvoie soit le JWT sous forme de chaîne, soit null. Elle permet l'extraction du JWT selon l'une des possibilités suivantes:
    * fromHeader (header_name) crée un nouvel extracteur qui recherche le JWT dans l'en-tête http donné
    * fromBodyField (field_name) crée un nouvel extracteur qui recherche le JWT dans le champ de corps donné. Vous devez avoir un analyseur de corps (body-parser) configuré pour utiliser cette méthode.
    * fromUrlQueryParameter (param_name) crée un nouvel extracteur qui recherche le JWT dans le paramètre de requête d'URL donné.
    * fromAuthHeaderWithScheme (auth_scheme) crée un nouvel extracteur qui recherche le JWT dans l'en-tête d'autorisation, en attendant que le schéma corresponde à auth_scheme.
    * fromAuthHeaderAsBearerToken () crée un nouvel extracteur qui recherche le JWT dans l'en-tête d'autorisation avec le schéma 'support'
    * fromExtractors ([tableau des fonctions d'extraction]) crée un nouvel extracteur en utilisant un tableau d'extracteurs fourni. Chaque extracteur est tenté dans l'ordre jusqu'à ce que l'on renvoie un jeton.
* algorithmes: Liste des chaînes avec les noms des algorithmes autorisés. Par exemple, ["HS256", "HS384"].
* ignoreExpiration: si vrai, ne valide pas l'expiration du jeton.
* passReqToCallback: Si la valeur est true, la demande sera transmise au rappel de vérification. c'est-à-dire vérifier (demande, jwt_payload, done_callback).

En ce qui nous concerne nous aurons besoin de deux paramètres seulement:


```
 Setup options for JWT Strategy
const jwtOptions = {
    secretOrKey: config.secret,
    jwtFromRequest: ExtractJwt.fromHeader('authorization')
}

```

ainsi le code de la partie jwtStrategy sera très similaire à celle de la stratégie locale, par contre nous ne fournissons plus les paramètres d'authentification, mais un token qui sera ajouté à toutes les requêtes, dans l'entête authorization, à partir de ce token, la stratégie pourra dans un premier temps valider le token puis en extraire l'utilisateur puisque dans le champs sub (subject) du token nous avons mis l'ObjectID (identifiant MongoDB) de l'utilisateur, rappelez vous que nous ne devons pas mettre de données sensibles sinon nous devrions utiliser jwe qui permet le cryptage de ces données sensibles.

ATTENTION: Rappelez vous que Node.js modifiera les entêtes en minuscule afin d'éviter les confusions avec certains serveurs qui sont "case-sensitive" et d'autres "case-insensitive". Ainsi `req.header('Authorization')` et `req.header('authorization')` auront le même résutat (puisque tout en interne est modifier en minusculeà), par contre pour ExtractJwt ca ne sera pas le cas, si vous demandez le champ 'Authorization' avec un A majuscule alors il cherchera ce champ qui en arrière plan a été mis en minuscule. Pour notre serveur veillez juste à choisir un nom d'entête en minuscule.

```
const passport = require('passport')
const LocalStrategy = require('passport-local') 

const JwtStrategy = require('passport-jwt').Strategy
const ExtractJwt = require('passport-jwt').ExtractJwt

const User = require('../models/user')
const config = require('../config')

// ...

const jwtOptions = {
    secretOrKey: config.secret,
    jwtFromRequest: ExtractJwt.fromHeader('authorization')
}


const jwtLogin = new JwtStrategy(jwtOptions, (payload, done) => {
    User.findById(payload.sub, (err, user) => {
        if (err) { return done(err, false) }

        if(user) {
            done(null, user) 
        } else {
            done(null, false) 
        }
    })

})

passport.use(jwtLogin)

```

Un petit test nous permet de voir que cela fonctionne. Vous devez juste créer un utilisateur via l'endpoint signup en méthode POST, puis revenir vers l'endpoint /api en méthode GET, rajouter l'entête autorization et y coller le token reçu.

Avec la commande cURL cela reviendrait à ceci:

`curl -X GET -H 'authorization: VOTRE_TOKEN' -i http://localhost:3000/api`


**Une dernière chose**: en ce qui concerne l'extraction à partir d'un élement de la requête, si vous pouvez utilisez l'entête authorization alors la ligne suivante fera l'affaire:

`jwtFromRequest: ExtractJwt.fromHeader('authorization')`

Si vous avez l'obligation d'utiliser le champ "Authorization" (avec un A majuscule) alors la ligne suivante fera l'affaire à condition de mettre avant le token "Bearer " (avec l'espace finale)

`jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()`

Et voila notre serveur est fini!

