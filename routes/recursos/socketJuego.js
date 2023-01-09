import Recursos from "./listaPartidas.js"

var recursos = new Recursos();

/*
    El socket referente a la escena juega funciona de otra manera.
    Solo va a ver dos emit y dos on. 'juego' y 'socketJuego'
    Y en los mensajes de estos va ir contruido con un objeto formado por dos elementos:
    {nombre de la funcion a ejecutar, argumentos para la funcion}
*/

// --- Funciones del servidor ---

/*
    Funcion test
*/
let test = (arg, server) => {
    server.emitirClienteJuego('testCliente', arg);
}


/*
    Funcion que recive la solicitud de mandar las manos de los contrincantes
*/
let getManoContrincantes = (arg, server, socket)=>{
    
    // argumentos
    let idPartida = arg.idPartida;
    let idJugador = arg.idJugador;

    // seleccionamos la partida
    let i_partida = recursos.buscarPartida(global.variable_partidas, idPartida);

    // objeto que vamos a mandar al cliente solicitante
    let cartasContrincantes = { manos:[
        {idJugador: undefined, mano: []},
        {idJugador: undefined, mano: []},
        {idJugador: undefined, mano: []}       
    ]};

    // orden en el que vamos a contruir el array manos, en base al orden de los jugadores respecto al cliente
    let ordenJugadores = []
    if(idJugador == 0) ordenJugadores = [1,2,3];
    if(idJugador == 1) ordenJugadores = [2,3,0];
    if(idJugador == 2) ordenJugadores = [3,0,1];
    if(idJugador == 3) ordenJugadores = [0,1,2];

    // rellenamos el array a mandar con las manos de los jugadores pertenecientes a la partida global
    cartasContrincantes.manos.forEach((mano,i)=>{
        mano.idJugador = ordenJugadores[i];
        mano.mano = global.variable_partidas[i_partida].partida.jugadores[ordenJugadores[i]].mano;
    })

    // llamamos al emisor del server para que mande el objeto cartasContrincantesç
    socket.emit('juego', {funcion: 'setManoContrincantes', argumentos: cartasContrincantes});

    //VAMOS A TENER QUE DESCARTAR ESTO POR LOS MOTIVOS EXPLICADOS EN BOLSILLOS, EN VEZ LO SUSTITUMOS POR LA FUNCIÓN QUE PRECEDE.
    //server.emitirClienteJuego('setManoContrincantes', cartasContrincantes);
}

// --- variable que exportamos donde guardamos las funciones ---
export let funcionesJuego = new Map;

funcionesJuego.set('test', test);
funcionesJuego.set('getManoContrincantes', getManoContrincantes);