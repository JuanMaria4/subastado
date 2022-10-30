import { Server } from "socket.io";
import http from "http";
import Recursos from "./listaPartidas.js"
import SocketPartida from "./socketPartida.js"


var recursos = new Recursos();


/* 
Clase que recoge la partida en el lado del servidor, se debe instanciar al crear la partida el jugador inicial
Quizas se deba guardar dentro de la partida correspodiente de la variable globar partida
*/

var test = "hola";
class Partida{
  constructor(partida){
    
    this.jugadores = [        /* Equipo Nosotros */                         /* Equipo Ellos */      
                      {id: "jugador0", nombre: null, listo: null}, {id: "jugador1", nombre: null, listo: null},        
                      {id: "jugador2", nombre: null, listo: null}, {id: "jugador3", nombre: null, listo: null}  
                      ];
    this.idPartida = partida.id; // id de la partida a la que pertenece
    this.nombreRoom = "room" + this.idPartida; // nombre de la room de la partida
    
  }
}
//***************************************************************
// variable de partida para el modo prueba
//***************************************************************
global.variable_partidas.push(  {
                                  id: 0,
                                  nombre_partida: 'partida_prueba',
                                  'contraseña': 'partida_prueba',
                                  puntos: '500',
                                  jugadores: 4,
                                  partida:{
                                            jugadores: [ 
                                                        {id: "jugador0", nombre: "antonio0", listo: true}, {id: "jugador1", nombre: "bernardo1", listo: true},        
                                                        {id: "jugador2", nombre: "castor2", listo: true}, {id: "jugador3", nombre: "dani3", listo: true}  
                                                       ],
                                            idPartida: 0,
                                            nombreRoom: 'room0'
                                          }
                                });
//****************************************************/
//****************************************************/

export default class Bolsillos{
    constructor(app){


      const server = http.createServer(app);
      const httpServer = server.listen(3000);
      const io = new Server(httpServer);
        
      io.on('connection', (socket)=>{
          console.log("nueva conexion"); 

 
             
          //*********** Evento inicial del cliente *********** //
          socket.on('valoresJugador', (valores)=>{    // Evento que se lanza cada vez que el cliente abre una partida, mandado el objeto con valoresJugadores
              
            if(valores.tipo == 'crear'){ //Si el jugador es el anfitrion
              let i_partida = recursos.buscarPartida(global.variable_partidas, valores.idPartida);
              global.variable_partidas[i_partida].partida = new Partida(global.variable_partidas[i_partida])
              socket.join(global.variable_partidas[i_partida].partida.nombreRoom) // Se une a la room de la partida a la que pertenece 
              
            }
            else if(valores.tipo == 'unir'){ //Si el jugador se une a la partida

              let i_partida = recursos.buscarPartida(global.variable_partidas, valores.idPartida);
              socket.join(global.variable_partidas[i_partida].partida.nombreRoom) // Se une a la room de la partida a la que pertenece
            }
            
            socket.data.idPartida = valores.idPartida; //Se guarda dentro del socket una elemento que recoge el id de la partida
            //socket.data.jugadrId = undefined; //aquí se guarda el jugador que ha elegido ser el cliente, para luego, si se desconecta borrarlo y dejarlo libre.
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
              // COMIENZA LA PARTIDA
              io.to(global.variable_partidas[i_partida].partida.nombreRoom).emit('inicioPartida');
              console.log("La partida ha dado comienzo");
              /* Ejemplo de la variable global que lo gestiona todo
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
            }


          });

          // Eventos de testeo
          socket.on('testClientePrueba', (valores)=>{
            let i_partida = recursos.buscarPartida(global.variable_partidas, valores.idPartida);
            io.to(global.variable_partidas[i_partida].partida.nombreRoom).emit('testClientePrueba');
          })


            
          // Evento de desconexion del cliente
          socket.on('disconnect', () => {
              console.log('usuario desconectado');    

              let i_partida = recursos.buscarPartida(global.variable_partidas, socket.data.idPartida);  

              //Borra el jugador del array jugadores y el estado
              
              global.variable_partidas[i_partida].partida.jugadores.forEach(jugador=>{

                if(jugador.id == socket.data.jugadorId){
                  jugador.nombre = null;
                  jugador.listo = null;
                }
              });
  
              io.to(global.variable_partidas[i_partida].partida.nombreRoom).emit('actualizarCliente', global.variable_partidas[i_partida].partida.jugadores);
              

              // A la partida que pertenece el cliente, al ser desconectado, se le resta un jugador y comprueba si tiene 0 jugadores, en ese caso se borra la partida
              global.variable_partidas[i_partida].jugadores--;
              if(global.variable_partidas[i_partida].jugadores < 1){global.variable_partidas.splice(i_partida, 1);}
 
            });


          //*********** Eventos de la partida *********** //
          // Eventos de la partida

          this.socketPartida = new SocketPartida(socket, io);
          this.socketPartida.test();

            

            
            
            
          

      }) 
      
      
            
            


        
     

    }
}