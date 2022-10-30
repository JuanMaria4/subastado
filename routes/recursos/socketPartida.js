export default class SocketPartida{
    constructor(socket, io){
        this.socket = socket;
        this.io = io;
    }

    test(){
        this.socket.on("test", ()=>{console.log("todo ok")});
        this.io.emit("prueba", {msg: "prueba"});
    }
}