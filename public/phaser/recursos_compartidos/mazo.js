export default class Mazo{
    constructor(){ // Este objeto debe ser una coleccion de recursos

        // Array que contiene la baraja
        this.baraja = [];

        // Valores de las cartas
        this.valoresCartas = {} // Creamos objeto carta
        this.valoresCartas.palo = ["Oros", "Copas", "Espadas", "Bastos"];
        this.valoresCartas.numero = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
        this.valoresCartas.fuerza = [10, 1, 9, 2, 3, 4, 5, 6, 7, 8];
        this.valoresCartas.puntos = [11, 0, 10, 0, 0, 0, 0, 2, 3, 4];
        this.valoresCartas.idSprite = [0,1,2,3,4,5,6,9,10,11,
                                       12,13,14,15,16,17,18,21,22,23,
                                       24,25,26,27,28,29,30,33,34,35,
                                       36,37,38,39,40,41,42,45,46,47];

        // función que rellena la baraja
        //this.construirBaraja(this.baraja);
    }

    // Método que completa la baraja con las cartas
    construirBaraja(baraja){

        for(let i=0; i<40; i++){
            baraja[i] = {
                                palo: this.valoresCartas.palo[(Math.trunc(i/10))],
                                numero: this.valoresCartas.numero[(i%10)],
                                fuerza: this.valoresCartas.fuerza[(i%10)],
                                puntos: this.valoresCartas.puntos[(i%10)],
                                idSprite: this.valoresCartas.idSprite[i], 
                                id: i //id de la carta, respectivo a su orden
                        }
        }

        return baraja;
    }

    // Método que dado un array de cartas, en base a su id, te devuelve los objetos cartas
    construirArrayCartas(arrayId){
        // arrayId consiste en un array de numeros que equivalen cada numero al id de la carta
        let arrayCartas = [] // array final que contendra las cartas
        arrayId.forEach(id => {
            arrayCartas.push({
                                palo: this.valoresCartas.palo[(Math.trunc(id/10))],
                                numero: this.valoresCartas.numero[(id%10)],
                                fuerza: this.valoresCartas.fuerza[(id%10)],
                                puntos: this.valoresCartas.puntos[(id%10)],
                                idSprite: this.valoresCartas.idSprite[id], 
                                id: id
                            });
        });

        return arrayCartas;
    }

    // Método que dado un array de cartas, te devuelve un array con sus id. Método inverso al anterior
    decostruirArrayCartas(arrayCartas){
        let arrayId = [];
        arrayCartas.forEach(carta => {arrayId.push(carta.id)});
        return arrayId;
    }

    crearSpriteCarta(escena, carta, posX, posY, test){
        // El sprite se guarda dentro de un objeto sprite de la carta
        carta.sprite = escena.add.sprite(posX, posY, 'cartas', carta.idSprite).setInteractive().setScale(0.75);
    }

    ordenarMano(mano){ // Dado un array de cartas lo ordena por su palo y numero
        mano.sort((a,b)=>{
            if((Math.trunc(a.id/10)*200-a.puntos*10-a.numero*2) > (Math.trunc(b.id/10)*200-b.puntos*10-b.numero*2)){return 1;}
            if((Math.trunc(a.id/10)*200-a.puntos*10-a.numero*2) < (Math.trunc(b.id/10)*200-b.puntos*10-b.numero*2)){return -1;}
            return 0;
        })
    }

    crearCartaContrincante(escena, posX, posY, carta, modoDearrollo, angle){

        if(modoDearrollo) carta.sprite = escena.add.sprite(posX, posY, 'cartas', carta.idSprite ).setScale(0.5).setAngle(angle);
        
        if(!modoDearrollo) carta.sprite = escena.add.sprite(posX, posY, 'cartas', 49 ).setScale(0.5).setAngle(angle);
        
    }

    /*
        Método que va devolver el siguiente jugador que tiene que pujar, y si este es el último que pujará
            En caso de que sea ultimo == true -> sólo tiene que elegir la muestra.
        rondaInicial: boolean, jugadoresPasado: array que esta en varaible partida.subasta y ultimoJugador: idJugador
        repartidor: el ultimo jugador en pujar. Dado que en cada partida va rotandonse
    */
    siguienteSubastador(rondaInicial, jugadoresPasado, ultimoPujador, repartidor){

        let siguienteJugador = {jugador: undefined, ultimo: false};

        // funcion que va a devolver si el jugador es definitivo_ultimo al hablar
        let ultimoJugador = (jugadoresPasado, jugadorId) => { 

            switch (jugadorId){
                case 0: if(jugadoresPasado[1]&&jugadoresPasado[3]) {return true};
                case 1: if(jugadoresPasado[0]&&jugadoresPasado[2]) {return true};
                case 2: if(jugadoresPasado[1]&&jugadoresPasado[3]) {return true};
                case 3: if(jugadoresPasado[0]&&jugadoresPasado[2]) {return true};
                default: return false;
            }
        }

        //funcion que va identificar si el proximo jugador a pasado, para devolver el próximo pujador correcto
        let saltarJugador = (ultimoPujador, jugadoresPasado) => {

            let pujadorProvisional = ultimoPujador == 3 ? 0 : ultimoPujador + 1; // array rotativo

            if(jugadoresPasado[pujadorProvisional]){
                return saltarJugador(pujadorProvisional, jugadoresPasado)
            }else{
                return pujadorProvisional;
            }
        }
             
        

        if(rondaInicial){
            siguienteJugador.jugador = ultimoPujador == 3 ? 0 : ultimoPujador + 1; // array rotativo
            //if(siguienteJugador.jugador == repartidor) siguienteJugador.ultimo = ultimoJugador(jugadoresPasado, siguienteJugador.jugador);
        }

        if(!rondaInicial){
            siguienteJugador.jugador = saltarJugador(ultimoPujador, jugadoresPasado);
            siguienteJugador.ultimo = ultimoJugador(jugadoresPasado, siguienteJugador.jugador);
        }

        return siguienteJugador;

    }

    /*
        Comprueba si es la puja final para establecerla como el jugador que llevará la subasta
        Solo en caso de haber pasado la ronda inicial
    */
    comprobarUltimaPuja(rondaInicial, jugadoresPasado, pujadorActual){

        let subastaFinalizada = false 

        // funcion que va a devolver si el jugador es definitivo_ultimo al hablar
        let ultimoJugador = (jugadoresPasado, jugadorId) => { 
            switch (jugadorId){
                case 0: if(jugadoresPasado[1]&&jugadoresPasado[3]) return true;
                case 1: if(jugadoresPasado[0]&&jugadoresPasado[2]) return true;
                case 2: if(jugadoresPasado[1]&&jugadoresPasado[3]) return true;
                case 3: if(jugadoresPasado[0]&&jugadoresPasado[2]) return true;
                default: return false;
            }
        }
        
        if (!rondaInicial){
            subastaFinalizada = ultimoJugador(jugadoresPasado, pujadorActual);
        }
        return subastaFinalizada;
    }
}