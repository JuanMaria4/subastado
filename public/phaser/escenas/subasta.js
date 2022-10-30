
export class Subasta extends Phaser.Scene {

    constructor(){
        super({ key: "Subasta" });



    }

    preload(){

        // Cartas <> 2496x1595 px 
         this.load.spritesheet('cartas', 'phaser/img/baraja.png', { frameWidth: (2496/12) , frameHeight: (1595/5), endFrame: 50 });

    }

    create(){
        console.log(this.game.datos_juego);
        this.game.datos_juego.socket.emit('testClientePrueba', {idPartida:this.game.datos_juego.idPartida});
        this.game.datos_juego.socket.on('testClientePrueba' ,()=>{console.log("ok")});



    }

}