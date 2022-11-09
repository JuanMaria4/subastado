import Mazo from "../recursos_compartidos/mazo.js";

export class Subasta extends Phaser.Scene {

    constructor(){
        super({ key: "Subasta" });
        this.mazo = new Mazo;
        this.mano = []; // contrenda en un inico un array con 10 cartas;
 
        

        


    }

    preload(){

        // inciacion de propiedades
        this.idPartida = this.game.datos_juego.idPartida;
        this.idJugador = this.game.datos_juego.nJugador; // jugadorX
        this.pnJugador =  this.posicionNJugador(this.game.datos_juego.nJugador); // Es la posicion en el array jugadores
        this.socket = this.game.datos_juego.socket;
        
        // Fondo
        this.load.image('fondo','phaser/img/fondo_madera.jpg');

        // Cartas <> 2496x1595 px 
         this.load.spritesheet('cartas', 'phaser/img/baraja.png', { frameWidth: (2496/12) , frameHeight: (1595/5), endFrame: 50 });

    }

    create(){

        //Fondo
        this.add.image(1920/2,1080/2,'fondo');

        //********************************************************//
        //***************** Métodos de testeo *******************//
        
        this.socket.on('cartaTestMovCliente', (id)=>{
            //console.log('cartaTestMovCliente ok: ' + parseInt(id, 10));
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
        this.getMano();
        this.socket.emit('jugadorListoSubasta',{idPartida: this.idPartida});
        //********************************************************//
 



    }

    repartirCartas(jugador){
        console.log("El jugador que va a repartir las cartas es: " + jugador);
    }

    //dado el id del jugador devuelve que posicion tiene en el array jugadores
    posicionNJugador(nJugador){
        let n = undefined;
        if(nJugador == 'jugador0'){n='0'}
        if(nJugador == 'jugador1'){n='1'}
        if(nJugador == 'jugador2'){n='2'}
        if(nJugador == 'jugador3'){n='3'}
        return n; // Se devuelve como string para que pueda ser mandado por los socket;
    }

    getMano(){ // Establece los métodos que gestionan los eventos que devuelven la mano tras repartir las cartas al estar todos los jugadores listos

        this.socket.on('setMano', (mano)=>{
            this.mano = this.mazo.construirArrayCartas(JSON.parse(mano));
            this.dibujarMano(this.mano);
            console.log(this.mano); // --- TEST --- //
        });

        this.socket.on('subastaCartasRepartidas', ()=>{
 
            this.socket.emit('getMano', {idPartida: this.idPartida, nJugador: this.pnJugador});
            
        });
    }

    dibujarMano(mano){
        mano.forEach((carta,i) => {
            this.mazo.crearSpriteCarta(this, carta, 275 + 150*i, 900, true);
        });
    }

    testCarta(idCarta){
        this.socket.emit('cartaTestMov', {id:idCarta})  
    }



}