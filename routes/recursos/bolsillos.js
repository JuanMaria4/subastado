import { Server } from "socket.io";
import http from "http";
import Recursos from "./listaPartidas.js"
import SocketSubasta from "./socketSubasta.js"
import Mazo from "../../public/phaser/recursos_compartidos/mazo.js";
import Ia from "../../public/phaser/recursos_compartidos/ia.js";
import { funcionesJuego } from "./socketJuego.js"; 


var recursos = new Recursos();


/* 
Clase que recoge la partida en el lado del servidor, se debe instanciar al crear la partida el jugador inicial
Quizas se deba guardar dentro de la partida correspodiente de la variable globar partida
*/


class Partida{
  constructor(partida){
    
    this.jugadores = [           /* Equipo Nosotros */                                                     /* Equipo Ellos */      
                      {id: 0, nombre: null, listo: null, bot: false, equipo:'Nosotros'}, {id: 1, nombre: null, listo: null, bot: false, equipo:'Ellos'},        
                      {id: 2, nombre: null, listo: null, bot: false, equipo:'Nosotros'}, {id: 3, nombre: null, listo: null, bot: false, equipo:'Ellos'}  
                      ];
    this.idPartida = partida.id; // id de la partida a la que pertenece
    this.nombreRoom = "room" + this.idPartida; // nombre de la room de la partida
    this.nBots = 0;
    this.establecerBots(partida);
  }

  establecerBots(partida){ //guarda los jugadores que corresponden como bots
    this.jugadores.forEach((jugador,i)=>{
      if(partida.bots[i]){
        jugador.nombre = "robot" + i; 
        jugador.listo = true; 
        jugador.bot = true;
        jugador.ia = new Ia(jugador.id, partida.id);
        this.nBots++;
      }
    })
  }
}

//***************************************************************
// variable de partida para el modo prueba
//***************************************************************
global.variable_partidas[0] = {
                                id: 0,
                                nombre_partida: 'partida_prueba',
                                contraseña: 'partida_prueba',
                                puntos: '500',
                                jugadores: 4,
                                partida:{
                                          jugadores: [ 
                                                      {id: 0, nombre: "antonio0", listo: true}, {id: 1, nombre: "bernardo1", listo: true},        
                                                      {id: 2, nombre: "castor2", listo: true}, {id: 3, nombre: "dani3", listo: true}  
                                                      ],
                                          idPartida: 0,
                                          nombreRoom: 'room0'
                                        },
                                completa: true      
                              };


//****************************************************/
//****************************************************/

//********Ejemplo de PARTIDA de la VARIABLE GLOBAL********//
/* 
{
  id: 0,
  nombre_partida: 'jm',
  'contraseña': 'jm',
  puntos: '300',
  jugadores: 4,
  partida: Partida {
    jugadores: [ [Object], [Object], [Object], [Object] ],
    idPartida: 0,
    nombreRoom: 'room0'
  }
}

jugadores: [
              { id: 'jugador0', nombre: 'q', listo: true },
              { id: 'jugador1', nombre: 'e', listo: true },
              { id: 'jugador2', nombre: 'w', listo: true },
              { id: 'jugador3', nombre: 'r', listo: true }
            ]
*/
//*************************************************************************************** */

export default class Bolsillos{
    constructor(app){

      const  PORT = process.env.PORT || 3000;
      const server = http.createServer(app);
      const httpServer = server.listen(PORT);
      const io = new Server(httpServer);
      
      //this.inicioPartida(global.variable_partidas[0].partida);
        
      io.on('connection', (socket)=>{ // Cada vez que alguien se conecte se va llamar a toda la fuciones de abajo
          console.log("nueva conexion"); 

             
          //*********** Evento inicial del cliente *********** //
          socket.on('valoresJugador', (valores)=>{    // Evento que se lanza cada vez que el cliente abre una partida, mandado el objeto con valoresJugadores

            let i_partida = recursos.buscarPartida(global.variable_partidas, valores.idPartida);

            if(global.variable_partidas[i_partida] != undefined){ // Desconoexion de emergencia en caso de false


              if(valores.tipo == 'crear'){ //Si el jugador es el anfitrion
                global.variable_partidas[i_partida].partida = new Partida(global.variable_partidas[i_partida])
                socket.join(global.variable_partidas[i_partida].partida.nombreRoom) // Se une a la room de la partida a la que pertenece 
                
              }
              else if(valores.tipo == 'unir'){ //Si el jugador se une a la partida
                socket.join(global.variable_partidas[i_partida].partida.nombreRoom) // Se une a la room de la partida a la que pertenece
              }
              
              // VARIABLE DATA DEL SOCKET en cargada de guardar variables globales respectivas a este
              socket.data.idPartida = valores.idPartida; //Se guarda dentro del socket una elemento que recoge el id de la partida
              socket.data.nombreRoom = global.variable_partidas[i_partida].partida.nombreRoom
              //socket.data.jugadrId = undefined; //aquí se guarda el jugador que ha elegido ser el cliente, para luego, si se desconecta borrarlo y dejarlo libre.
            }else{
              socket.emit('forceDisconnect');
            }

          });


          //*********** Eventos de la sala incial *********** //

          // ---- precarga una ver cargada la escena
          socket.on('precarga', (valores)=>{
            let i_partida = recursos.buscarPartida(global.variable_partidas, valores.idPartida);
            socket.emit('precarga', global.variable_partidas[i_partida].partida.jugadores);
          });



          // Recibe por parte del cliente los jugadores actualizados
          // Cada vez que el cliente manda una actualizacion al server de jugadores, el server tiene que mandar de vuelta a todos los clientes los jugadores actualizados
          socket.on('actualizarServer',(valores) => { //ACTUALIZA EL ARRAY DEL SERVIDOR

            let i_partida = recursos.buscarPartida(global.variable_partidas, valores.idPartida);

            global.variable_partidas[i_partida].partida.jugadores.forEach( (jugador,i) => {
                  jugador.nombre = valores.jugadores[i].nombre;
                  jugador.listo = valores.jugadores[i].listo;
            }); 

            socket.to(global.variable_partidas[i_partida].partida.nombreRoom).emit('actualizarCliente', global.variable_partidas[i_partida].partida.jugadores)

            socket.data.jugadorId = valores.jugadorId; 

            // Recorre el array jugadores, para en el caso en que este completo y todos listos lanzar la partida
          
            let comenzarPartida = true;

            global.variable_partidas[i_partida].partida.jugadores.forEach( (jugador,i) => {
              if(jugador.nombre == undefined || jugador.listo != true){
                comenzarPartida = false;
              }
            });
            
            if(comenzarPartida){

              // COMIENZA LA SUBASTA              
              this.inicioPartida(global.variable_partidas[i_partida].partida);
              io.to(global.variable_partidas[i_partida].partida.nombreRoom).emit('inicioPartida'); // lanza el cambio de escena a los cliente
              console.log("La subasta ha dado comienzo");
 
                        
            }

          });

          //*********** Eventos de la Subasta *********** //
 
          this.socketSubasta = new SocketSubasta(socket, io, global.variable_partidas);
          this.socketSubasta.comienzaSubasta(); // Devuelve a las jugadores el feedback de que los 4 estan iniciado en la subasta
          this.socketSubasta.manoCliente(); // Establece el metodo que devueove al cliente la mano del jugador ya barajadas
          this.socketSubasta.pujaCliente(); // Establece el proceder de la puja cliente
          this.socketSubasta.muestraElegida(); // Establece el proceder tras finalizar la puja con eleccion de muestra
          this.socketSubasta.listoParaPartida();

          //*********** Eventos del Juego *********** //

          
          //on 
          socket.on('serverJuego', (arg)=>{
            funcionesJuego.get(arg.funcion)(arg.argumentos, this, socket);
          })


          // VA TENER QUE QEDAR EN DESUSO, DADO QUE SOLO RESPONDE AL PRIMER SOCKET QUE SOLICITA Y CUANDO LE EMITE EL SEGUNDO SE LO MANDA DE NUEVO AL PRIMERO. DESCONOZCO POR QUÉ.
          // A PARTIR DE AHORA SERÁ EL SOCKET DIRECTAMENTE DESDE LA FUNCION EL QUE EMITA
          // emit
          this.emitirClienteJuego = (funcionSolicitada, objetoMandado) => {
            // la idea es conducir todo el flujo de emit por aqui por si fuera necesario añadir un try
            socket.emit('juego', {funcion: funcionSolicitada, argumentos: objetoMandado});
          }


          //*********** Eventos de testeo *********** //
          socket.on('cartaTestMov', (valores)=>{
            console.log('cartaTestMov ok: ' + valores.id);
            socket.to(socket.data.nombreRoom).emit('cartaTestMovCliente', valores.id);
          })
          

        
          //*********** Eventos de desconexión del cliente   *********** //
          socket.on('disconnect', () => {
              console.log('usuario desconectado');
              
   
              let i_partida = recursos.buscarPartida(global.variable_partidas, socket.data.idPartida); 

              if(global.variable_partidas[i_partida] != undefined){  // para resolver el error de jugador que refresca la partida

                //Borra el jugador del array jugadores y el estado
                global.variable_partidas[i_partida].partida.jugadores.forEach(jugador=>{

                  if(jugador.id == socket.data.jugadorId){
                    jugador.nombre = null;
                    jugador.listo = null;
                  }
                });
                
                // Solo para cuando se está en la escen inicial
                if(global.variable_partidas[i_partida].partida.subasta == undefined){
                  io.to(global.variable_partidas[i_partida].partida.nombreRoom).emit('actualizarCliente', global.variable_partidas[i_partida].partida.jugadores);
                }

                // A la partida que pertenece el cliente, al ser desconectado, se le resta un jugador y comprueba si tiene 0 jugadores, en ese caso se borra la partida
                global.variable_partidas[i_partida].jugadores--;
                
                if(global.variable_partidas[i_partida].jugadores < 1){
                  console.log("Partida con id: " + global.variable_partidas[i_partida].id + " eliminada") // Avisa que la partida ha sido finalizada
                  global.variable_partidas.splice(i_partida, 1);
                }
              }
 
            });
     
      }) 

    }

    
    //******************************************************************//
    //****************    EVENTOS DEL INICIO DE LA PARTIDA   **********//
    //******************************************************************//
    
    /*
    Método que establece las variable oportunas para el inicio de la partida tras la sala incial donde se establecen los equipos
    Variable que extiende a la variable partida para la subasta
    */

    inicioPartida(partida){
      
      // La subasta tiene un método que restaura todos sus valores de cara a las siguientes rondas de la inicial
      partida.subasta = {
                          jugadorRepartidor: 0, // dentro de partida, crea el objeto subasta, con el jugador que inica repartiendo
                          subastaComienza: partida.nBots, // cuando sea igual a 4 determinara que todos los jugadores están listos
                          subastaFinaliza: partida.nBots,
                          rondaInicial: true,
                          jugadoresPasado: [false,false,false,false], // array que recoje los jugadores que han pasado asociados a su orden
                          pujaVencedora: {jugador: undefined, equipo: undefined, puntos: undefined, palo: undefined}
                        }; 

      partida.baraja = []; // Elemento que contendra el conjunto de las cartas, que serán ordenadas de una determinada manera
      partida.mazo = new Mazo(); // es una clase que dota de metodos auxiliares tanto al server como al cliente en lo relativo a la mecanica del juego
      
      partida.subasta.restaurar = ()=>{console.log('metodo que restaura la subasta para las siguientes rondas')};
    }

    
 

    //******************************************************************//
}