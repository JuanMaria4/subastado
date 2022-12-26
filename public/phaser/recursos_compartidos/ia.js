export default class Ia{
    constructor(idJugador, idPartida){
        this.idjugador = idJugador;
        this.idPartida = idPartida;
    }

    lanzarPuja(ultimo, pujaActual, socketSubasta){
        let puja = {idJugador: this.idjugador, idPartida: this.idPartida, paso:true, cantidad:'paso', actual:pujaActual};
        socketSubasta.actualizarPuja(puja);
    }
}