import Mazo from "../recursos_compartidos/mazo.js";

export class Juego extends Phaser.Scene {
    constructor(){
        super({ key: "Juego" });
        this.mazo = new Mazo;
        this.manosContrincantes = [{n:1, angle: -90, mano:[]}, {n:2, angle: 180, mano:[]}, {n:3, angle: 90, mano:[]}];
        this.velocidadJuego = 500;
        this.modoDearrollo = true;

       
 
    }

    preload(){

        // inciacion de propiedades
        this.idPartida = this.game.datos_juego.idPartida;
        this.idJugador = this.game.datos_juego.nJugador; // "jugadorX" ejemplo -> jugador1
        this.jugadores = this.game.datos_juego.partida // array que contiene los datos de los cuatro jugadores
        this.socket = this.game.datos_juego.socket;
        this.mano = this.game.datos_juego.mano; // contrenda en un inico un array con 10 cartas;

        // gestión del socket        
        this.funcionesSocket = new Map(); // instanciamos la variable map que recogerá el conjunto de funciones        
        this.funcionesSocket.set('testCliente', this.testCliente); // funcion test comunicacion
        this.funcionesSocket.set('setManoContrincantes', this.setManoContrincantes) // Lista de funciones que establecen la comunicación con el server

        this.socket.on('juego', (arg)=>{ // objeto que se manda desde el server: {nombrefuncion, argumentos}
            console.log(arg);//TEST
            this.funcionesSocket.get(arg.funcion)(arg.argumentos, this);
        })

        this.emitirServer = (funcionSolicitada, objetoMandado) => { 
            // la idea de esto conducir todo el flujo de emit respecto del cliente por aqui por si se necesita un try
            this.socket.emit('serverJuego', {funcion: funcionSolicitada, argumentos: objetoMandado})
        }


        
        // Fondo
        this.load.image('fondo','phaser/img/fondo_madera.jpg');

        // FullScreen
        this.load.spritesheet('full', 'phaser/img/full.png', { frameWidth: (80) , frameHeight: (80), endFrame: 1 });

        // Cartas <> 2496x1595 px 
        this.load.spritesheet('cartas', 'phaser/img/baraja.png', { frameWidth: (2496/12) , frameHeight: (1595/5), endFrame: 50 });

        // Elementos de la subasta
        this.load.image('pizarra', 'phaser/img/pizarra_bonita.png');
        this.load.spritesheet('flechas', 'phaser/img/flechas2.png', { frameWidth: (100) , frameHeight: (150), endFrame: 200 });
        this.load.spritesheet('okey', 'phaser/img/okey.png', { frameWidth: (100) , frameHeight: (100), endFrame: 1 });
        this.load.image('bocadillo', 'phaser/img/bocadillo.png')
    }

    create(){

        //Fondo
        this.add.image(1920/2,1080/2,'fondo');

        // FullScreen
        this.buttonFullScreen = this.add.image(1920 - 80, 0 + 80, 'full', 0).setOrigin(1, 0).setInteractive();
        this.buttonFullScreen.on('pointerup', function () {
            if (this.scale.isFullscreen){
                this.buttonFullScreen.setFrame(0);
                this.scale.stopFullscreen();
            }else{
                this.buttonFullScreen.setFrame(1);
                this.scale.startFullscreen();
            }
        }, this);

        // Dibujar cartas
        this.dibujarMano(this.mano);

        this.activarElegirCarta();



        //********************************************************//
        //***************** Métodos de testeo *******************//

        console.log('comienza partida')
        
        this.socket.on('cartaTestMovCliente', (id)=>{
            let arrayFicticio = []
            arrayFicticio.push(parseInt(id, 10))
            let carta = this.mazo.construirArrayCartas(arrayFicticio)[0];
            console.log(carta);
            this.mazo.crearSpriteCarta(this, carta, 500,500,false);
        })
        
        
        
        
        //********************************************************//
        //********************************************************//


        //********************************************************//
        //***************** Metodos Iniciales ********************//
        //********************************************************//

        // Puesta inicial por pantalla de las cartas del contrincante
        /*
            Le solicita primero al server las manos del resto de jugadores
            las guarda dentro de la variable local de la escena manosContrincantes
            y las dibuja por pantalla
        */
        this.emitirServer('getManoContrincantes', {idPartida: this.idPartida, idJugador: this.idJugador}) 

 
        





        //********************************************************//

        

 



    }

    //******** METODOS AUXILIARES DE LA ESCENA **************

    ordenarMano(mano){ // Dado un array de cartas lo ordena por su palo y numero
        mano.sort((a,b)=>{
            if((Math.trunc(a.id/10)*200-a.puntos*10-a.numero*2) > (Math.trunc(b.id/10)*200-b.puntos*10-b.numero*2)){return 1;}
            if((Math.trunc(a.id/10)*200-a.puntos*10-a.numero*2) < (Math.trunc(b.id/10)*200-b.puntos*10-b.numero*2)){return -1;}
            return 0;
        })
    }

    dibujarMano(mano){
        mano.forEach((carta,i) => {
            this.mazo.crearSpriteCarta(this, carta, 100 + 145*i, 930, true);
        });
    }

    testCarta(idCarta){
        this.socket.emit('cartaTestMov', {id:idCarta})  
    }

    dibujarManoContrincantes(modoDearrollo){ // Dibuja por pantalla revorso de carta y su posicion

        for (let i = 0; i < 10; i++) { this.mazo.crearCartaContrincante(this,1370,150+(i*50), this.manosContrincantes[0].mano[i], modoDearrollo, this.manosContrincantes[0].angle) }
        
        for (let i = 0; i < 10; i++) { this.mazo.crearCartaContrincante(this,550+(i*50),130, this.manosContrincantes[1].mano[i], modoDearrollo, this.manosContrincantes[1].angle) }

        for (let i = 0; i < 10; i++) { this.mazo.crearCartaContrincante(this,130,150+(i*50), this.manosContrincantes[2].mano[i], modoDearrollo, this.manosContrincantes[2].angle) }

        this.desplegarNombresContrincantes();
        
    }

    /*
        método que se va a encargar de desplegar los nombres de cada jugador detras de su mano de cartas
    */
    desplegarNombresContrincantes(){

        // array que contiene los nombres del resto de jugadores ajustado a su posición
        let listaNombres = []; 
        if(this.idJugador == 0) listaNombres = [ this.jugadores[1].nombre, this.jugadores[2].nombre, this.jugadores[3].nombre];
        if(this.idJugador == 1) listaNombres = [ this.jugadores[2].nombre, this.jugadores[3].nombre, this.jugadores[0].nombre];
        if(this.idJugador == 2) listaNombres = [ this.jugadores[3].nombre, this.jugadores[0].nombre, this.jugadores[1].nombre];
        if(this.idJugador == 3) listaNombres = [ this.jugadores[0].nombre, this.jugadores[1].nombre, this.jugadores[2].nombre];
        
        // lugar de la pantalla donde estarán los nombres de cada jugador
        let posNom = [
            {x: 1460, y: 640, angle:-90},
            {x: 510, y: 10, angle: 0},
            {x: 45, y: 110, angle: 90}
        ]

        // Generamos los nombres
        posNom.forEach((elem, i) => {
          this.add.text(elem.x, elem.y, listaNombres[i]).setFontSize(35).setAngle(elem.angle).setFill('#000000').setFontFamily('Arial');  
        });
        
    }

    // EN COSTRUCCION
    //metodo que dada unas cartas añadirá en estas, segun sean legales o no jugarlas, la posibilidad de clikearlas
    activarElegirCarta(cartasMesa){
        //test -->
        this.mano.forEach((carta)=>{
            carta.sprite.on('pointerup', ()=>{ 

                this.tweens.add({
                    targets: carta.sprite,
                    y:500,x:800,
                    duration: this.velocidadJuego,
                });         
            });
        });   
    }

    // *** FUNCIONES DE LA COMUNICACION CLIENTE SERVIDOR ***

    // funcion test
    testCliente(arg){
        console.log(arg);
    }

    /*
        Vamos a crear un modo desarrollador. Este modo va consistir poder ver las cartas del contrincante.
        Comenzamos por un metodo que solicita al servidor las cartas del resto de jugadores.
        Tenemos que recivir del servidor tres array con las cartas correspondientes.
        ¿Dónde estan guardadas las cartas de los jugadores? -> Cada jugador tiene su mano.

    */

    // metodo que consultamos al servidor las cartas del contrincante y nos devuelve la mano de cada jugador
    setManoContrincantes(cartasContrincantes, escena){
        /*
            Aquí llamamos al objeto mano de cada contrincante y vamos añadiendo las cartas recividas del server,
            que le corresponde a cada uno.
            Recibe un obj con un array mano desde el server con:
                let cartasContrincantes = { manos:[
                    {idJugador: undefined, mano: []},
                    {idJugador: undefined, mano: []},
                    {idJugador: undefined, mano: []}]};                 
        */
        

        escena.manosContrincantes.forEach((contrincante, i)=>{                
            for (let index = 0; index < 10; index++) {
                contrincante.mano.push(cartasContrincantes.manos[i].mano[index]);        
            }
            escena.ordenarMano(contrincante.mano)           
        })
        escena.dibujarManoContrincantes(escena.modoDearrollo);
    }

}

// Timer event
/*
timedEvent = this.time.delayedCall(3000, onEvent, [], this);

character.sprite.play("ball_out").once('animationcomplete', () => {
   character.sprite.play("feather_in");
});
*/