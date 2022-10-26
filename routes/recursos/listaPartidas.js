export default class Recursos{
    
    
    comprobar_contraseña(lista_partidas, partida, contraseña){
        // retorna true si la contraseña coincide con la partida solicitada, en cualquier otro caso retorna false
        let resultado = false;

        lista_partidas.forEach(element => { 
            if( element.id == partida && element.contraseña == contraseña){
                resultado = true;
            }           

        }); 

        return resultado;
    }

    //Dada la lista de partidas devuelve el indice de la partida buscada
    buscarPartida(lista_partidas, partida_buscada){
         

        for(var i=0; i<lista_partidas.length; i++){
  
            if(lista_partidas[i].id==partida_buscada){
                break;
            } 
      
        }

        return i;
    }
}