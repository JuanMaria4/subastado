
const posEquipos = [
                    {x: 350 + 200, y: 400},
                    {x: 1150 + 200, y: 400},
                    {x: 350 + 200, y: 600},
                    {x: 1150 + 200, y: 600},
                ];

export class Inicio extends Phaser.Scene {
    
    constructor(){
        super({ key: "inicio" });

        this.jugadores = [{}, {}, {}, {}]; // Objeto que recogerá la representacion de cada jugador (sea visible o no, dependerá si se ha entrado en la partida).
        this.jugadorId = undefined; // numero del jugador -> jugadorX
        this.jugadorListo = undefined;


    }

    preload(){
        this.load.image('fondo','phaser/img/fondo_madera.jpg');

        
        // FullScreen
        this.load.spritesheet('full', 'phaser/img/full.png', { frameWidth: (80) , frameHeight: (80), endFrame: 1 });

        // Icono listo
        this.load.spritesheet('icono_listo', 'phaser/img/icono_listo2.png', { frameWidth: (100) , frameHeight: (100), endFrame: 1 });

        // img vacio
        this.load.image('espacio_libre','phaser/img/espacio_libre.png');

        // Icono seleccionar si esta listo el jugador
        this.load.spritesheet('icono_seleccionar', 'phaser/img/icono_seleccionar_listo.png', { frameWidth: (100) , frameHeight: (100), endFrame: 1 });






        
    } 

    create(){

        console.log(this.scene.get('EscenaPartida'));

        //Fondo
        this.add.image(1920/2,1080/2,'fondo');


        //  ---- Precarga inicial con el server: ----

        this.actualizarCliente();
        this.inicioPartida();
        this.game.datos_juego.socket.emit('precarga', {idPartida: this.game.datos_juego.idPartida });

        this.game.datos_juego.socket.on('precarga', (datos) => {

            this.jugadores = datos;

            //Reresentamos los huecos vacion o completos en la pantalla del cliente
            this.jugadores.forEach( (jugador, i) =>{

                if(jugador.nombre == undefined){
                    jugador.image = this.add.image(posEquipos[i].x, posEquipos[i].y,'espacio_libre').setInteractive();
                    jugador.image.on('pointerup', ()=>{

                        this.jugadorId = i;
                        jugador.nombre = this.game.datos_juego.apodo;
                        this.actualizarServer(this.game.datos_juego.idPartida, this.jugadores, this, this.jugadorId);

                    });
                }
                if(jugador.nombre != undefined ){
                    jugador.image = this.add.text(posEquipos[i].x -200 , posEquipos[i].y, jugador.nombre).setFontSize(80).setFontFamily('Arial').setFill('#2E2E2E');
                    if(jugador.listo){ 
                        jugador.imageIcono = this.add.image(posEquipos[i].x - 230, posEquipos[i].y + 5, 'icono_listo', 1).setOrigin(1, 0).setScale(0.8);
                    }
                    else{
                        jugador.imageIcono = this.add.image(posEquipos[i].x - 230, posEquipos[i].y + 5, 'icono_listo', 0).setOrigin(1, 0).setScale(0.8);
                    }
                }
            });

        });

        
        // ---- Botones: -----

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

        // Icono seleccionar listo
        this.iconoSeleccionarListo = this.add.image(990, 900, 'icono_seleccionar', 0).setOrigin(1, 0).setInteractive().setScale(0.8);
        this.iconoSeleccionarListo.on('pointerup', function () {

            if (this.jugadorListo){

                this.iconoSeleccionarListo.setFrame(0);
                this.jugadorListo = false;
                this.actulizarEstado(false);

            }else if(this.jugadorId != undefined){

                this.iconoSeleccionarListo.setFrame(1);
                this.jugadorListo = true;
                this.actulizarEstado(true);
            }
        }, this);

        
        // ---- Texto Estático: -----

        // Nosotros - Ellos
        this.add.text(330, 200, 'NOSOTROS').setFontSize(100).setFontFamily('Arial').setFill('#000000');
        this.add.text(1130, 200, 'ELLOS').setFontSize(100).setFontFamily('Arial').setFill('#000000');
        // Subrayado del texto
        this.add.text(332, 190, '__________').setFontSize(100).setFontFamily('Arial').setFill('#000000');
        this.add.text(1130, 190, '______').setFontSize(100).setFontFamily('Arial').setFill('#000000');
        // Listo
        this.add.text(700, 900, 'Listo:').setFontSize(80).setFontFamily('Arial').setFill('#000000');


    }

    /*
     Actualiza la varibale jugadores, estableciendo una comunicación con el server. 
      - Se debe crear la representacion de cada jugador, de cara a optar por cada equipo ( aunque todavia no sea visible)
      - y actualizarse con cada llamada a esta funcion
     */


    actualizar(){
        
        this.jugadores.forEach( (jugador, i) =>{

            // Al principio de cada actualizacion se destruye todas las imagenes
            jugador.image.destroy();
            if (jugador.imageIcono != undefined) { jugador.imageIcono.destroy(); }

            // En caso de que sea un hueco vacio
            if(jugador.nombre == undefined){
                jugador.image = this.add.image(posEquipos[i].x, posEquipos[i].y,'espacio_libre').setInteractive();
                jugador.image.on('pointerup', ()=>{
                    
                    this.actualizarId();
                    this.jugadorId =  i;
                    jugador.nombre = this.game.datos_juego.apodo;


                    this.actualizarServer(this.game.datos_juego.idPartida, this.jugadores, this, this.jugadorId);
                });
            }

            // En caso de que hay un jugador en la posicion
            if(jugador.nombre != undefined ){
                    jugador.image = this.add.text(posEquipos[i].x -200 , posEquipos[i].y, jugador.nombre).setFontSize(80).setFontFamily('Arial').setFill('#2E2E2E');
                    if(jugador.listo){ 
                        jugador.imageIcono = this.add.image(posEquipos[i].x - 230, posEquipos[i].y + 5, 'icono_listo', 1).setOrigin(1, 0).setScale(0.8);
                    }
                    else{
                        jugador.imageIcono = this.add.image(posEquipos[i].x - 230, posEquipos[i].y + 5, 'icono_listo', 0).setOrigin(1, 0).setScale(0.8);
                    }

            }
            
        });
    }

    
    // Borra el nombre del jugador cliente donde estaba situado anteriormente y borra su estado de listo
    actualizarId(){ 
        this.jugadores.forEach( (jugador) => {
            if(jugador.id == this.jugadorId){
                jugador.nombre = null;
                jugador.listo = null;
                this.iconoSeleccionarListo.setFrame(0);

            }
        });
    }

    // Actuliza dentro de la variable jugadores el estdo del jugador
    actulizarEstado(listo){
        this.jugadores.forEach( (jugador) => {
            if(jugador.id == this.jugadorId){
                jugador.listo = listo;
                this.actualizarServer(this.game.datos_juego.idPartida, this.jugadores, this, this.jugadorId);
            }
        });
    }




    // ------------ METODOS SOCKET ---------------//

    // envia al server el array jugadores del cliente
    // se debe tener en cuanta antes el array del server y sobrescribir aquel
    // se manda el juadorId para aduntarlo al objeto socket del servidor
    actualizarServer(idPartida, jugadores, escena, jugadorId){

        escena.game.datos_juego.socket.emit('actualizarServer', {idPartida: idPartida, jugadores: jugadores, jugadorId: jugadorId});
        escena.actualizar(escena.jugadores, idPartida, escena.game.datos_juego.apodo, escena);
    }

    // funcion que reconoce el evente enviado por el servidor
    // cada vez que recibe el evento, éste actualiza la pantalla del cliente
    
    actualizarCliente(){

        this.game.datos_juego.socket.on('actualizarCliente', (jugadoresServer) => {

            this.jugadores.forEach((jugador,i) => {
                jugador.nombre = jugadoresServer[i].nombre;
                jugador.listo = jugadoresServer[i].listo
            }) 
            //this.actualizar(this.jugadores, this.game.datos_juego.idPartida, this.game.datos_juego.apodo, this);
            this.actualizar();
        });
    }

    // inicia la partida, cambiando escena, una vez que los cuatro jugadores estén listos
    
    inicioPartida(){

        this.game.datos_juego.socket.on('inicioPartida', ()=>{
            this.game.datos_juego.partida = this.jugadores;
            this.game.datos_juego.nJugador = this.jugadorId;
            this.scene.start('Subasta');       
        });
    }   


    
}


