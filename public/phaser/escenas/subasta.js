import Mazo from "../recursos_compartidos/mazo.js";

export class Subasta extends Phaser.Scene {

    constructor(){
        super({ key: "Subasta" });
        this.mazo = new Mazo;
        this.mano = []; // contrenda en un inico un array con 10 cartas;
        this.manosContrincantes = [{n:1, angle: -90, mano:[]}, {n:2, angle: 180, mano:[]}, {n:3, angle: 90, mano:[]}];
 
        

        


    }

    preload(){

        // inciacion de propiedades
        this.idPartida = this.game.datos_juego.idPartida;
        this.idJugador = this.game.datos_juego.nJugador; // "jugadorX" ejemplo -> jugador1
        this.pnJugador =  this.posicionNJugador(this.game.datos_juego.nJugador); // Es la posicion en el array jugadores
        this.jugadores = this.game.datos_juego.partida // array que contiene los datos de los cuatro jugadores
        this.socket = this.game.datos_juego.socket;
        
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
        
        this.dibujarManoContrincantes();
        this.dibujarPizarra(80);
        //********************************************************//
        //********************************************************//


        //********************************************************//
        //***************** Metodos Iniciales ********************//
        //********************************************************//
        this.getMano();
        this.socket.emit('jugadorListoSubasta',{idPartida: this.idPartida, pnJugador: this.pnJugador});
        //********************************************************//

 



    }

    //******** METODOS AUXILIARES DE LA ESCENA **************

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
            this.mazo.ordenarMano(this.mano);
            this.dibujarMano(this.mano);
            console.log(this.mano); // --- TEST --- //
        });

        this.socket.on('subastaCartasRepartidas', ()=>{
 
            this.socket.emit('getMano', {idPartida: this.idPartida, nJugador: this.pnJugador});
            
        });
    }

    dibujarMano(mano){
        mano.forEach((carta,i) => {
            this.mazo.crearSpriteCarta(this, carta, 100 + 145*i, 930, true);
        });
    }

    testCarta(idCarta){
        this.socket.emit('cartaTestMov', {id:idCarta})  
    }

    dibujarManoContrincantes(){ // Dibuja por pantalla revorso de carta y su posicion

        for (let i = 0; i < 10; i++) { this.mazo.crearCartaContrincante(this,1370,150+(i*50), this.manosContrincantes[0]) }
        
        for (let i = 0; i < 10; i++) { this.mazo.crearCartaContrincante(this,550+(i*50),130, this.manosContrincantes[1]) }

        for (let i = 0; i < 10; i++) { this.mazo.crearCartaContrincante(this,130,150+(i*50), this.manosContrincantes[2]) }

        this.desplegarNombresContrincantes();
        
    }

    /*
        método que se va a encargar de desplegar los nombres de cada jugador detras de su mano de cartas
    */
    desplegarNombresContrincantes(){

        // array que contiene los nombres del resto de jugadores ajustado a su posición
        let listaNombres = []; 
        if(this.pnJugador == 0) listaNombres = [ this.jugadores[1].nombre, this.jugadores[2].nombre, this.jugadores[3].nombre];
        if(this.pnJugador == 1) listaNombres = [ this.jugadores[2].nombre, this.jugadores[3].nombre, this.jugadores[0].nombre];
        if(this.pnJugador == 2) listaNombres = [ this.jugadores[3].nombre, this.jugadores[0].nombre, this.jugadores[1].nombre];
        if(this.pnJugador == 3) listaNombres = [ this.jugadores[0].nombre, this.jugadores[1].nombre, this.jugadores[2].nombre];
        
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

    // ************** MÉTODOS QUE ORQUESTAN LA SUBASTA ********************** //

    /*
        Devuelve un objeto que contendrá: jugador subastador,
        puntos de la subasta.
        Lanzará la llamada a que el jugador subastador eliga muestra y de comienzo a la partida. 
        En el estraño caso de que todos pasen, el último jugador no podrá pasar.
    */
    comenzarSubasta(jugadorRepartidor){
        let puntos = undefined;
        let jugadorSubastador;

        return {jugadorSubastador: jugadorSubastador, puntos: puntos}

    }

    /*
        Abre una pantalla para que el jugador subastador eliga la muestra
        de la partida.
        y lanza la escena juego
    */
    lanzarElegirMuestra(jugadorSubastador, puntos){
        let muestra = undefined;
        
    }

    /*
        Manda el mensaje al server de la apuesta y borra la pizarra. Se queda a la espera de que otro jugador hable.
    */
    lanzarPuja(puja){
        let sube = puja.sube;
        let cantidad = puja.cantidad;
        let actual = puja.actual;

        this.socket.emit('puja', {sube:sube, cantidad:cantidad, actual:actual})

    }

    /*
        Dibuja la pizarra
    */
   dibujarPizarra(pujaActual){

        this.puja = {sube: false, cantidad: 'Paso', actual: pujaActual}; // contendrá el valor a pujar y sera una variable de escena
        let pos = {x:350, y:250};

        let pizarra = this.add.image(pos.x, pos.y, 'pizarra').setScale(0.65).setOrigin(0,0);
        let flechaIzq = this.add.image(pos.x+150, pos.y+320, 'flechas', 1).setOrigin(0, 0).setInteractive();
        let flechaDer = this.add.image(pos.x+550, pos.y+320, 'flechas', 1).setOrigin(1, 1).setInteractive().setAngle(180);
        let okey = this.add.image(pos.x+325, pos.y+320, 'okey', 1).setOrigin(0, 0).setScale(1.5).setInteractive();
        
        let textoTuPuja = this.add.text(pos.x+120, pos.y+80, 'ELIGE TU PUJA:').setFontSize(70).setFill('#000000').setFontFamily('Arial');
        
        let textoValorPuja = this.add.text(pos.x+320, pos.y+200, this.puja.cantidad).setFontSize(60).setFill('#42320A').setFontFamily('Arial');
        
        // Array guardado en la escena que recoge el conjunto de sprite para eliminarlo luego de una vez
        this.conjuntoPizarra = [pizarra,  flechaIzq, flechaDer, okey, textoTuPuja, textoValorPuja];

        // Añadimos funcionalidad a las botones
        // Flecha izquierda
        flechaIzq.on('pointerdown', function () {this.conjuntoPizarra[1].setFrame(0);}, this);
        flechaIzq.on('pointerup', function () {this.conjuntoPizarra[1].setFrame(1);                                                    
                                                switch(this.puja.cantidad){
                                                    case 'Mala leche!': 
                                                        break;
                                                    case 'Paso':  
                                                        this.puja.cantidad = 'Mala leche!';
                                                        break;
                                                    default:
                                                        if(this.puja.cantidad -5 <= this.puja.actual){
                                                            this.puja.sube = false; 
                                                            this.puja.cantidad = 'Paso';
                                                        } else{
                                                            this.puja.cantidad = this.puja.cantidad-5;   
                                                        }
                                                }
                                                this.conjuntoPizarra[5].setText(''+this.puja.cantidad);}, this);

        // Flecha derecha
        flechaDer.on('pointerdown', function () {this.conjuntoPizarra[2].setFrame(0); this.conjuntoPizarra[2].x += 2;}, this);
        flechaDer.on('pointerup', function () {this.conjuntoPizarra[2].setFrame(1); this.conjuntoPizarra[2].x -= 2;                                                    
                                                switch(this.puja.cantidad){
                                                    case 'Mala leche!': 
                                                        this.puja.cantidad = 'Paso';
                                                        break;
                                                    case 'Paso':  
                                                        this.puja.sube = true;
                                                        this.puja.cantidad = this.puja.actual + 5;
                                                        break;
                                                    default:
                                                        if(this.puja.cantidad +5 <= 230){
                                                            this.puja.cantidad = this.puja.cantidad+5;  
                                                        }
                                                }
                                                this.conjuntoPizarra[5].setText(''+this.puja.cantidad);}, this);

        // Flecha okey
        okey.on('pointerdown', function () {this.conjuntoPizarra[3].setFrame(0);}, this);
        okey.on('pointerup', function () {this.conjuntoPizarra[3].setFrame(1); 
                                            console.log(this.puja); // TEST
                                            this.lanzarPuja(this.puja);
                                            this.conjuntoPizarra.forEach(elem => {elem.destroy()});                                        
                                        }, this);

        
    }




}