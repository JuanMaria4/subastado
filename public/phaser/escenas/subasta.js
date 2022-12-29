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
        this.jugadores = this.game.datos_juego.partida // array que contiene los datos de los cuatro jugadores
        this.socket = this.game.datos_juego.socket;
        this.arrayBocadillos = [];
        
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

        //********************************************************//
        //***************** Métodos de testeo *******************//
        
        this.socket.on('cartaTestMovCliente', (id)=>{
            let arrayFicticio = []
            arrayFicticio.push(parseInt(id, 10))
            let carta = this.mazo.construirArrayCartas(arrayFicticio)[0];
            console.log(carta);
            this.mazo.crearSpriteCarta(this, carta, 500,500,false);
        })
        
        
        this.dibujarManoContrincantes();
        if(this.idJugador == 1){this.dibujarPizarra(50, 1);} // TEST en el que el jugador pirmero en hablar...
        this.siguienteSubasta();
        this.representacionGraficaPuja();
        this.mostrarPujaDerecha();
        this.pujaFinalizada();

        
        //********************************************************//
        //********************************************************//


        //********************************************************//
        //***************** Metodos Iniciales ********************//
        //********************************************************//
        this.getMano();
        this.socket.emit('jugadorListoSubasta',{idPartida: this.idPartida, idJugador: this.idJugador});
        //********************************************************//

 



    }

    //******** METODOS AUXILIARES DE LA ESCENA **************

    repartirCartas(jugador){
        console.log("El jugador que va a repartir las cartas es: " + jugador);
    }

    getMano(){ // Establece los métodos que gestionan los eventos que devuelven la mano tras repartir las cartas al estar todos los jugadores listos

        this.socket.on('setMano', (mano)=>{
            this.mano = this.mazo.construirArrayCartas(JSON.parse(mano));
            this.mazo.ordenarMano(this.mano);
            this.dibujarMano(this.mano);
            console.log(this.mano); // --- TEST --- //
        });

        this.socket.on('subastaCartasRepartidas', ()=>{
 
            this.socket.emit('getMano', {idPartida: this.idPartida, nJugador: this.idJugador});
            
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

    // ************** MÉTODOS QUE ORQUESTAN LA SUBASTA ********************** //

    /*
        Representación gráfica de la puja del jugador
    */
    representacionGraficaPuja(){
        this.socket.on('pujaJugador', (puja)=>{
            console.log('El jugador ' + puja.nombreJugador + ': ' + puja.cantidad);
        })
    }

    /*
        Devuelve un objeto que contendrá: jugador subastador,
        puntos de la subasta.
        Lanzará la llamada a que el jugador subastador eliga muestra y de comienzo a la partida. 
        En el estraño caso de que todos pasen, el último jugador no podrá pasar.
    */
    siguienteSubasta(jugadorRepartidor){
        this.socket.on('siguientePujador', (situacionPuja) =>{

            if(situacionPuja.ultimo){
                this.escogerMuestra(situacionPuja.pujaActual); // Es el jugador que llevará la subasta y por tanto tiene que escoger muestra
            }else{
                this.dibujarPizarra(situacionPuja.pujaActual, situacionPuja.jugadorActual); // Debe lanzar una nueva puja
            }


        });


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
        let pasa = puja.pasa;
        let cantidad = puja.cantidad;
        let pujaActual = puja.pujaActual;
        let jugadorActual = puja.jugadorActual // jugador dominante en la puja


        this.socket.emit('puja', {idJugador: this.idJugador, idPartida: this.idPartida, pasa: pasa, cantidad: cantidad, pujaActual: pujaActual, jugadorActual: jugadorActual})

    }

    /*
        Manda el mensaje al server de la apuesta y borra la pizarra. Se queda a la espera de que otro jugador hable.
    */
    muestraElegida(subasta){ //let subasta = {cantidad: pujaActual, muestra: 'oros', jugadorId: this.idJugador}
        let puntos = subasta.cantidad;
        let muestra = subasta.muestra;

        this.socket.emit('muestraElegida', {idJugador: subasta.jugadorId, idPartida: this.idPartida, cantidad: puntos, muestra: muestra})

    }

    /*
        Dibuja la pizarra
    */
   dibujarPizarra(pujaActual, jugadorActual){

        this.puja = {pasa: true, cantidad: 'Paso', pujaActual: pujaActual, jugadorActual: jugadorActual}; // contendrá el valor a pujar y sera una variable de escena
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
                                                        if(this.puja.cantidad -5 <= this.puja.pujaActual){
                                                            this.puja.pasa = true; 
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
                                                        this.puja.pasa = false;
                                                        this.puja.cantidad = this.puja.pujaActual + 5;
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
                                            
                                            if(!this.puja.pasa){ // actualiza la puja actual en caso de que suba
                                                this.puja.pujaActual = this.puja.cantidad;
                                                this.puja.jugadorActual = this.idJugador;
                                            }; 
                                            this.lanzarPuja(this.puja);
                                            this.conjuntoPizarra.forEach(elem => {elem.destroy()});                                        
                                        }, this);

        
    }

    /*
        Dibuja la pizarra donde se escogerá la muestra
    */
    escogerMuestra(pujaActual){
        
        let subasta = {cantidad: pujaActual, muestra: 'oros', jugadorId: this.idJugador} // contendrá el valor de la subasta
        let pos = {x:350, y:250};
        let palos = {arrayPalos: ['oros', 'espadas', 'copas', 'bastos'], paloActual: 0};

        let pizarra = this.add.image(pos.x, pos.y, 'pizarra').setScale(0.65).setOrigin(0,0);
        let flechaIzq = this.add.image(pos.x+150, pos.y+320, 'flechas', 1).setOrigin(0, 0).setInteractive();
        let flechaDer = this.add.image(pos.x+550, pos.y+320, 'flechas', 1).setOrigin(1, 1).setInteractive().setAngle(180);
        let okey = this.add.image(pos.x+325, pos.y+320, 'okey', 1).setOrigin(0, 0).setScale(1.5).setInteractive();
        
        let textoTuPuja = this.add.text(pos.x+120, pos.y+80, 'ELIGE MUESTRA:').setFontSize(70).setFill('#000000').setFontFamily('Arial');
        
        let textoMuestra = this.add.text(pos.x+320, pos.y+200, 'oros').setFontSize(60).setFill('#42320A').setFontFamily('Arial');
        
        // Array guardado en la escena que recoge el conjunto de sprite para eliminarlo luego de una vez
        this.conjuntoPizarra = [pizarra,  flechaIzq, flechaDer, okey, textoTuPuja, textoMuestra, palos, subasta];

        // Añadimos funcionalidad a las botones
        // Flecha izquierda
        flechaIzq.on('pointerdown', function () {this.conjuntoPizarra[1].setFrame(0);}, this);
        flechaIzq.on('pointerup', function () {this.conjuntoPizarra[1].setFrame(1);                                                    
                                                
                                                let nPalo = this.conjuntoPizarra[6];
                                                nPalo.paloActual = nPalo.paloActual == 0 ? 3 : (nPalo.paloActual - 1);
                                                this.conjuntoPizarra[5].setText(''+this.conjuntoPizarra[6].arrayPalos[nPalo.paloActual]);}, this);

        // Flecha derecha
        flechaDer.on('pointerdown', function () {this.conjuntoPizarra[2].setFrame(0); this.conjuntoPizarra[2].x += 2;}, this);
        flechaDer.on('pointerup', function () {this.conjuntoPizarra[2].setFrame(1); this.conjuntoPizarra[2].x -= 2;                                                    
                                                
                                                let nPalo = this.conjuntoPizarra[6];
                                                nPalo.paloActual = nPalo.paloActual == 3 ? 0 : (nPalo.paloActual + 1);
                                                this.conjuntoPizarra[5].setText(''+this.conjuntoPizarra[6].arrayPalos[nPalo.paloActual]);}, this);

        // Flecha okey
        okey.on('pointerdown', function () {this.conjuntoPizarra[3].setFrame(0);}, this);
        okey.on('pointerup', function () {this.conjuntoPizarra[3].setFrame(1);
                                            
                                            this.conjuntoPizarra[7].muestra = this.conjuntoPizarra[6].arrayPalos[this.conjuntoPizarra[6].paloActual];
                                            this.muestraElegida( this.conjuntoPizarra[7]);
                                            this.conjuntoPizarra.forEach((elem,i) => {if(i<6) elem.destroy()});                                        
                                        }, this);

    

    }

    /*
        Método encargado de mostrar a la derecha la puja de cada jugador.
    */
    mostrarPujaDerecha(){
        
        let indice = 1;

        let pos = {x:1550, y:250};
        let textoTituloSubasta = this.add.text(pos.x, pos.y-50, 'SUBASTA:').setFontSize(60).setFill('#000000').setFontFamily('Arial');

        this.socket.on('pujaJugador', (puja)=>{
            this.dibujarBocadillo(puja.cantidad, puja.jugador);
            this.add.text(pos.x , pos.y + 50*indice, puja.cantidad + ' -> ' + puja.nombreJugador).setFontSize(40).setFill('#000000').setFontFamily('Arial');
            indice++;
        })

    }

    /*
        Muestra el bocadillo con la puja por pantalla
    */
    dibujarBocadillo(cantidad, jugador){
        let pos = [{x:750, y:750, angle:0},{x:1220, y:500, angle:-90},{x:750, y:200, angle:180},{x:280, y:500, angle:90}];
        let sumaX = [-70,-50,-70,50];
        let sumaY = [-50, 70, -30, -70];

        let posJugador = [];
        if(this.idJugador == 0) posJugador = [0,1,2,3];
        if(this.idJugador == 1) posJugador = [3,0,1,2];
        if(this.idJugador == 2) posJugador = [2,3,0,1];
        if(this.idJugador == 3) posJugador = [1,2,3,0];

        let texto = cantidad == 'Mala leche!' ? 'M.L.': cantidad;
        let i = posJugador[jugador];

        let bocadillo = this.add.image(pos[i].x, pos[i].y, 'bocadillo', 0).setAngle(pos[i].angle);
        let angleText = i == 2 ? 0 : pos[i].angle; // para que el texto no se de la vuelta
        let bocadilloTexto = this.add.text(pos[i].x + sumaX[i], pos[i].y + sumaY[i], texto).setFontSize(60).setAngle(angleText).setFill('#000000').setFontFamily('Arial');
        this.arrayBocadillos.push(bocadillo);
        this.arrayBocadillos.push(bocadilloTexto);

    }

    lanzarListoPartida(){
        this.socket.emit('listoParaPartida', {});
    }

    pujaFinalizada(){
        this.socket.on('pujaFinalizada', (puja)=>{
            this.arrayBocadillos.forEach(element => {
                element.destroy(); 
   
            });

            let pos = {x:350, y:250};
            this.add.image(pos.x, pos.y, 'pizarra').setScale(0.65).setOrigin(0,0);
            this.okey = this.add.image(pos.x+325, pos.y+320, 'okey', 1).setOrigin(0, 0).setScale(1.5).setInteractive();
            this.text1 = this.add.text(pos.x+120, pos.y+100, 'SUBASTA: ' + this.jugadores[puja.idJugador].nombre ).setFontSize(60).setFill('#000000').setFontFamily('Arial');
            this.text2 = this.add.text(pos.x+130, pos.y+160,  puja.cantidad + ' a ' + puja.muestra).setFontSize(60).setFill('#000000').setFontFamily('Arial');
        
            this.okey.on('pointerdown', function () {this.okey.setFrame(0);}, this);
            this.okey.on('pointerup', function () {this.okey.setFrame(1);
                    this.lanzarListoPartida();
                    this.text1.destroy();
                    this.text2.destroy();
                    this.okey.destroy();
                    this.add.text(pos.x+120, pos.y+120, 'Esperando al resto\n de jugadores' ).setFontSize(70).setFill('#000000').setFontFamily('Arial');
                    }, this);
        
        })
    }




}