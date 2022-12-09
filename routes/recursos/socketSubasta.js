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
            this.partidas[valores.idPartida].partida.jugadores[valores.pnJugador].idSocket = this.socket.id;
            
            this.partidas[valores.idPartida].partida.subasta.subastaComienza++;
            //console.log('desde el metodo: ' + this.partidas[valores.idPartida].partida.subasta.subastaComienza); //---TEST--//
            
            if(this.partidas[valores.idPartida].partida.subasta.subastaComienza >= 4){

                //TEST
                console.log('lista jugadores con sus id:');
                console.log(this.partidas[valores.idPartida].partida.jugadores[3])

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
    */
    pujaCliente(){
        this.socket.on('puja', (puja)=>{
            console.log(puja);
        })
    }    

 
}