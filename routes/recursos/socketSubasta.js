import Recursos from "./listaPartidas.js"

var recursos = new Recursos();

export default class SocketSubasta{
    constructor(socket, io, partidas){
        this.socket = socket;
        this.io = io;
        this.partidas = partidas; //variable que recoje las partidas generales
        
    }

    // Método que rellena una baraja con las cartas del mazo de forma aleatoria
    barajarBaraja(mazo, barajaPartida){

        mazo.construirBaraja(mazo.baraja);
        barajaPartida = [];

        for(let i=0; i<40; i++){
            let icarta = Math.trunc(Math.random()*(40-i)); // Seleccionamos indice aleatorio
            barajaPartida[i] = mazo.baraja[icarta];
            mazo.baraja.splice(icarta,1); // añadimos  y eliminamos la carta a la baraja de la partida 
        }

        return barajaPartida;   
    }

    // Método que dado un array de jugadores, crea en cada uno de ellos una mano, que será un array que recogera 10 cartas aleatorias
    repartirCartas(jugadores, mazo, barajaPartida){
        //barajaPartida = mazo.construirBaraja(mazo.baraja); // !!!!!!  cartas no aleatorias !!!!!!
        barajaPartida = this.barajarBaraja(mazo, barajaPartida);

        for(let j=0; j<4; j++){
            
            jugadores[j].mano = []; // Dentro de la variable global de la propia partida, cada jugador tendrá su mano
            
            for(let i=0; i<10; i++){
                jugadores[j].mano[i] = barajaPartida[0];
                barajaPartida.splice(0,1);
            };
        }
    }



    // Método de comprobación de que los cuatro jugadores estan listo en la subasta
    //  cuando lo 4 jugadore esten el el metodo create lanzara la subasta
    comienzaSubasta(){
        this.socket.on('jugadorListoSubasta', (valores)=>{

            // funcion necesaria para encontrar en el array de partidas por el id
            let i_partida = recursos.buscarPartida(global.variable_partidas, valores.idPartida); 

            //añadimos al jugador humano su id de socket, para reconocer cada jugador por su socket en uso aposteriori
            this.partidas[i_partida].partida.jugadores[valores.idJugador].idSocket = this.socket.id;

            //añadimos a cada socket su id del jugador, para reconocer el jugador desde el server
            this.socket.data.idJugador = valores.idJugador;

            
            this.partidas[i_partida].partida.subasta.subastaComienza++;
            
            if(this.partidas[i_partida].partida.subasta.subastaComienza >= 4){

                //Crea la variable mano en los 4 jugadores con las cartas repartidas
                this.repartirCartas(this.partidas[i_partida].partida.jugadores, this.partidas[i_partida].partida.mazo, this.partidas[i_partida].partida.baraja);
                
                //Trasmite a los jugadores que las cartas están repartidas
                this.io.to(this.partidas[i_partida].partida.nombreRoom).emit("subastaCartasRepartidas"); 

                //Le da a la ia la direccion en memoria del array que contiene la mano de los jugadores bots
                this.partidas[i_partida].partida.jugadores.forEach(jugador => {
                    if(jugador.bot) jugador.ia.jugador = jugador;
                });

                // Lanza el comienzo del circuito de la subasta, dando lugar a que el primer jugador puje
                this.lanzarPrimerPujador(i_partida);
            }


        });
    }

    manoCliente(){ // Método que solicitada la mamo que le corresponde por un jugador se la manda del server al cliente
        this.socket.on('getMano', (valores)=>{

            // funcion necesaria para encontrar en el array de partidas por el id
            let i_partida = recursos.buscarPartida(global.variable_partidas, valores.idPartida); 

            let mano = this.partidas[i_partida ].partida.jugadores[valores.nJugador].mano;
            let stringMano = JSON.stringify(this.partidas[i_partida ].partida.mazo.decostruirArrayCartas(mano)); 
            this.socket.emit('setMano', stringMano);
        })
    }
     
    /*
        Método que recibe la puja del cliente y en base a esta tiene que
        puja {pasa: boolean, cantidad: number o string, actual: es la cantidad de la puja dominante}
    */
    pujaCliente(){
        this.socket.on('puja', (puja)=>{ // puja: {idJugador: n, idPartida: n, pasa:pasa, cantidad:cantidad, actual:actual, jugadorActual: idJugador}
            this.actualizarPuja(puja);
        })
    }

    actualizarPuja(puja){ // puja: {idJugador: n, idPartida: n, pasa:pasa, cantidad:cantidad, actual:actual, jugadorActual: idJugador}

        // funcion necesaria para encontrar en el array de partidas por el id
        let i_partida = recursos.buscarPartida(global.variable_partidas, puja.idPartida); 

 
        // Se da el problema que al ser un bot no tene los datos referentes del socket. Debo crear una variable globar que lo gestiones todo¿?.
        let jugador = puja.idJugador;
        let partida = this.partidas[i_partida].partida;
        

        // mandamos al resto de jugadores la puja del jugador 
        this.io.to(partida.nombreRoom).emit('pujaJugador', {jugador: jugador, cantidad: puja.cantidad, nombreJugador: partida.jugadores[jugador].nombre})

        // actualizamos: 
       
        //situacion del jugador respecto a la subasta de su partida
        partida.subasta.jugadoresPasado[jugador] = puja.pasa;
        //si ha finalizado la ronda inicial
        if(jugador == partida.subasta.jugadorRepartidor) partida.subasta.rondaInicial = false;

        // discernimos si ya ha terminado la puja, o hay que elegir el siguiente pujador
        let siguientePujador = undefined;


        if(partida.mazo.comprobarUltimaPuja(partida.subasta.rondaInicial, partida.subasta.jugadoresPasado, puja.jugadorActual)){

            siguientePujador = {jugador: puja.jugadorActual, ultimo: true};

        }else{

            siguientePujador = partida.mazo.siguienteSubastador(partida.subasta.rondaInicial, 
                                                                    partida.subasta.jugadoresPasado, 
                                                                    jugador, 
                                                                    partida.subasta.jugadorRepartidor)
        }


        //discernimos si es un robot o humano

        /*
            Le vamos a mandar a los jugadores o bot si es el ultimo y la puja actual.
            En caso de ser el último tendrá solamente que escoger muestra y el será el jugador que lleve la subasta
        */

        if(partida.jugadores[siguientePujador.jugador].bot){

            //simula la llamada al socket del cliente.
            if(siguientePujador.ultimo){partida.jugadores[siguientePujador.jugador].ia.elegirMuestra(puja.pujaActual, this);}
            if(!siguientePujador.ultimo){partida.jugadores[siguientePujador.jugador].ia.lanzarPuja(puja.pujaActual, puja.jugadorActual, this);}

        }else{
            // Le manda al jugador si va a ser el ultimo, para que además eliga muestra y consolide la subasta. La puja actual que es necesaria para el proceso.
            this.io.to(partida.jugadores[siguientePujador.jugador].idSocket).emit('siguientePujador', {ultimo: siguientePujador.ultimo, pujaActual: puja.pujaActual, jugadorActual: puja.jugadorActual});
        }
    }

    muestraElegida(){
        this.socket.on('muestraElegida', (subasta)=>{ //{idJugador: this.jugadorId, idPartida: this.idPartida, cantidad: puntos, muestra: muestra}
            this.muestraElg(subasta)
        })
    }

    muestraElg(subasta){ //{idJugador: this.idJugador, idPartida: this.idPartida, cantidad: pujaActual, muestra: muestra}

            // funcion necesaria para encontrar en el array de partidas por el id
            let i_partida = recursos.buscarPartida(global.variable_partidas, subasta.idPartida);

            let partida = this.partidas[i_partida].partida;
            partida.subasta.pujaVencedora = {//pujaVencedora: {jugador: undefined, equipo: undefined, puntos: undefined, palo: undefined}
                jugador: subasta.idJugador,
                equipo: this.partidas[i_partida].partida.jugadores[subasta.idJugador].equipo,
                puntos: subasta.cantidad,
                palo: subasta.muestra
            }
            
            this.io.to(partida.nombreRoom).emit('pujaFinalizada', {idJugador: subasta.idJugador, cantidad: subasta.cantidad, muestra: subasta.muestra})
    }

    listoParaPartida(){
 
        this.socket.on('listoParaPartida', (idPartida)=>{

            // funcion necesaria para encontrar en el array de partidas por el id
            let i_partida = recursos.buscarPartida(global.variable_partidas, idPartida);

            this.partidas[i_partida].partida.subasta.subastaFinaliza++
            if(this.partidas[i_partida].partida.subasta.subastaFinaliza++ >= 4) {
                console.log('Empieza la partida: ' + this.partidas[i_partida].partida.subasta.pujaVencedora.equipo) //TEST
                this.io.to(this.partidas[i_partida].partida.nombreRoom).emit('listoParaPartida');
            }
        });
    }
    
    /*
        Método inicial que va a lanzar la subasta
        El primer jugador en hablar será el siguiente al jugador repartidor
        Jugador repartidor es variable guardada en partida.subasta.jugadorRepartidor

        Este método será iniciado tras estar todos los jugadores listos, con cartas repartidas
    */
    
    lanzarPrimerPujador(idPartida){

        let jugadorRepartidor = this.partidas[idPartida].partida.subasta.jugadorRepartidor;
        let jugadorInicial = jugadorRepartidor == 3 ? 0 : jugadorRepartidor+1 //array rotativo
        let partida = this.partidas[idPartida].partida
        

        // Discernimos si es bot o humano
        if(partida.jugadores[jugadorInicial].bot){
            partida.jugadores[jugadorInicial].ia.lanzarPuja(45, jugadorInicial , this)
        }else{
            this.io.to(partida.jugadores[jugadorInicial].idSocket).emit('siguientePujador', {ultimo: false, pujaActual: 45, jugadorActual: jugadorInicial});
        }

    }

 
}