export default class Ia{
    constructor(idJugador, idPartida){
        this.idJugador = idJugador;
        this.idPartida = idPartida;
        this.jugador = undefined; // Direccion en memoria al objeto jugador, para poder acceder a la mano de éste.
    }

    // Termina subastando esta ia y elegiendo muestra
    elegirMuestra(pujaActual, socketSubasta){ 

        let muestra = 'Oros';
        let nAs = [] //palos de los cantes
        let cantes = [] //palos en los que tiene cante


        //si hay cantes y palo de estos
        let palos = ['Oros', 'Copas', 'Espadas', 'Bastos'];
        palos.forEach(palo=> {
            let completo = 0;
            this.jugador.mano.forEach(carta => {
                if(carta.palo == palo && carta.numero == 11) completo++;
                if(carta.palo == palo && carta.numero == 12) completo++; 
            });
            if(completo == 2) cantes.push(palo);           
        });

        // numero de ases y sus palos
        this.jugador.mano.forEach(carta => {
            if(carta.numero == 1) nAs.push(carta.palo)
        });

        // algoritmo para determinar muestra
        if(cantes.length > 0) muestra = cantes[0]
        if(!cantes.length > 0 && nAs.length > 0) muestra = nAs[0]

        socketSubasta.muestraElg({idJugador: this.idJugador, idPartida: this.idPartida, cantidad: pujaActual, muestra: muestra})

    }//{idJugador: subasta.jugadorId, idPartida: this.idPartida, cantidad: puntos, muestra: muestra}

    // El humano envia esto {idJugador: this.idJugador, idPartida: this.idPartida, pasa: pasa, cantidad: cantidad, actual: pujaActual, jugadorActual: jugadorActual}
    lanzarPuja(pujaActual, jugadorActual, socketSubasta){
        
        let puja = {

            idJugador: this.idJugador, 
            idPartida: this.idPartida, 
            pasa:true, cantidad:'paso', 
            pujaActual:pujaActual, 
            jugadorActual: jugadorActual
        };

        let puntosEventuales = this.puntosMano(this.jugador.mano);

        // opciones de la ia segun la subasta actual
        let pujar = (pts) =>{puja.cantidad = pts; puja.pasa = false; puja.pujaActual = pts}

        if(puntosEventuales > pujaActual){ pujar(puntosEventuales);
        }else{
            if((pujaActual-puntosEventuales) <= 10){ pujar(pujaActual+5) }
            if((puntosEventuales >= 65) && ((pujaActual-puntosEventuales) > 10 )){puja.cantidad = 'Mala leche!';}
        }


        if(!puja.pasa) puja.jugadorActual = this.idJugador;
        socketSubasta.actualizarPuja(puja);
    }

    // algoritmo que establece el valor de los puntos de la mano
    puntosMano(mano){

        let ptsMano = 0;
        let nAs = [] //palos de los cantes
        let cantes = [] //palos en los que tiene cante
        let coincide = false; //true en caso de que coincida un cante un as


        //si hay cantes y palo de estos
        let palos = ['Oros', 'Copas', 'Espadas', 'Bastos'];
        palos.forEach(palo=> {
            let completo = 0;
            mano.forEach(carta => {
                if(carta.palo == palo && carta.numero == 11) completo++;
                if(carta.palo == palo && carta.numero == 12) completo++; 
            });
            if(completo == 2) cantes.push(palo);           
        });

        // numero de ases y sus palos
        mano.forEach(carta => {
            if(carta.numero == 1) nAs.push(carta.palo)
        });

        // determina si coincide
        nAs.forEach(as => {cantes.forEach(cante =>{if(as == cante) coincide = true})});

        // determinamos puntos en base a las variables
        ptsMano = 50
        if(nAs.length == 1) ptsMano += 10;
        if(nAs.length == 2) ptsMano += 10;
        if(cantes.length > 0) ptsMano += 5;
        if(coincide) ptsMano = 100


        return ptsMano;
    }
}