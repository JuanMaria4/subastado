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
        barajaPartida = this.barajarBaraja(mazo, barajaPartida);

        for(let j=0; j<4; j++){
            
            jugadores[j].mano = [];
            
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

            //añadimos al jugador humano su id de socket, para reconocer cada jugador por su socket en uso aposteriori
            this.partidas[valores.idPartida].partida.jugadores[valores.idJugador].idSocket = this.socket.id;

            //añadimos a cada socket su id del jugador, para reconocer el jugador desde el server
            this.socket.data.idJugador = valores.idJugador;

            
            this.partidas[valores.idPartida].partida.subasta.subastaComienza++;
            
            if(this.partidas[valores.idPartida].partida.subasta.subastaComienza >= 4){

                //Crea la variable mano en los 4 jugadores con las cartas repartidas
                this.repartirCartas(this.partidas[valores.idPartida].partida.jugadores, this.partidas[valores.idPartida].partida.mazo, this.partidas[valores.idPartida].partida.baraja);
                
                //Trasmite a los jugadores que las cartas están repartidas
                this.io.to(this.partidas[valores.idPartida].partida.nombreRoom).emit("subastaCartasRepartidas");
            }


        });
    }

    manoCliente(){ // Método que solicitada la mamo que le corresponde por un jugador se la manda del server al cliente
        this.socket.on('getMano', (valores)=>{
            let mano = this.partidas[valores.idPartida].partida.jugadores[valores.nJugador].mano;
            let stringMano = JSON.stringify(this.partidas[valores.idPartida].partida.mazo.decostruirArrayCartas(mano)); 
            this.socket.emit('setMano', stringMano);
        })
    }
     
    /*
        Método que recibe la puja del cliente y en base a esta tiene que
        puja {pasa: boolean, cantidad: number o string, actual: es la cantidad de la puja dominante}
    */
    pujaCliente(){
        this.socket.on('puja', (puja)=>{ // puja: {idJugador: n, idPartida: n, pasa:pasa, cantidad:cantidad, actual:actual}
            this.actualizarPuja(puja);
        })
    }

    actualizarPuja(puja){ // puja: {idJugador: n, idPartida: n, pasa:pasa, cantidad:cantidad, actual:actual}

 
        // Se da el problema que al ser un bot no tene los datos referentes del socket. Debo crear una variable globar que lo gestiones todo¿?.
        let jugador = puja.idJugador;
        let partida = this.partidas[puja.idPartida].partida;
        

        // mandamos al resto de jugadores la puja del jugador 
        this.io.to(partida.nombreRoom).emit('pujaJugador', {jugador: jugador, cantidad: puja.cantidad, nombreJugador: partida.jugadores[jugador].nombre})

        // actualizamos: 
       
        //situacion del jugador respecto a la subasta de su partida
        partida.subasta.jugadoresPasado[jugador] = puja.pasa;
        //si ha finalizado la ronda inicial
        if(jugador == partida.subasta.jugadorRepartidor) partida.subasta.rondaInicial = false;

        // establecemos el siguiente pujador <no esta del todo bien hecho>*
        let siguientePujador = partida.mazo.siguienteSubastador(partida.subasta.rondaInicial, 
                                                                partida.subasta.jugadoresPasado, 
                                                                jugador, 
                                                                partida.subasta.jugadorRepartidor)


        //discernimos si es un robot o humano

        /*
            Le vamos a mandar a los jugadores o bot si es el ultimo y la puja actual.
            En caso de ser el último tendrá solamente que escoger muestra y el será el jugador que lleve la subasta
        */

        if(partida.jugadores[siguientePujador.jugador].bot){
            console.log("El siguiente jugador es un Robot y es el: " + partida.jugadores[siguientePujador.jugador].nombre) //TEST
            //simula la llamada al socket del cliente.
            partida.jugadores[siguientePujador.jugador].ia.lanzarPuja(siguientePujador.ultimo, puja.actual, this);
        }else{
            // Le manda al jugador si va a ser el ultimo, para que además eliga muestra y consolide la subasta. La puja actual que es necesaria para el proceso.
            this.io.to(partida.jugadores[siguientePujador.jugador].idSocket).emit('siguientePujador', {ultimo: siguientePujador.ultimo, pujaActual: puja.actual});
        }
    }
    


 
}