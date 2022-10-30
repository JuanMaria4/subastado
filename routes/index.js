import {Router} from 'express';
const router = Router();
import Recursos from "./recursos/listaPartidas.js"
var recursos = new Recursos();


global.variable_partidas = [];

var numero_partida = 0;
 //{id: 0, nombre_partida: "test", contraseña: 1234, puntos: 300, jugadores: 0}

router.get('/', (req,res,next) => {
    res.render('index');
});

router.post('/index', (req,res,next) => {
    // Si el cliente se une a la partida
    if (req.body.sala == "unir"){
        res.render('UnirPartida',{pet: req.body, lista_partidas: global.variable_partidas, contraseña_incorrecta:false});
    }
    // Si el cliente crea a la partida
    if (req.body.sala == "crear"){
        res.render('CrearPartida',{pet: req.body});
    } 
});

router.post('/partida', (req,res,next) => {
    // Unirse a la partida
    if(req.body.tipo == "unir"){

        //comprobamos si la contraseña es correcta(renderizamos la partida) o incorrecta(renderizamos unir partida)
        // Datos que se la manda a la partida desde unir -> {tipo:unir/crear | apodo:"string" | partida_formulario: id de la partida | contraseña: strign}
        if (recursos.comprobar_contraseña(global.variable_partidas, req.body.partidas_formulario, req.body.contraseña)){
            global.variable_partidas[recursos.buscarPartida(global.variable_partidas, req.body.partidas_formulario)].jugadores++ ; 
            res.render('partida',{
                                    apodo: req.body.apodo,
                                    id_partida: req.body.partidas_formulario, 
                                    tipo: "unir",
                                    modo_prueba: false,
                                    n_jugador: undefined
                                });
        }
        else{res.render('UnirPartida',{pet: req.body, lista_partidas: global.variable_partidas, contraseña_incorrecta:true});}
    };
    // Crear la partida
    if(req.body.tipo == "crear"){
       
        global.variable_partidas.push({id: numero_partida, nombre_partida: req.body.name, contraseña: req.body.contraseña, puntos: req.body.puntos, jugadores: 1});        
        res.render('partida',{
                                apodo:req.body.apodo, 
                                id_partida: numero_partida,
                                tipo: "crear",
                                modo_prueba: false,
                                n_jugador: undefined
                            }); 
        numero_partida = ++numero_partida;
    };
});

//*************************************************************************//
// Rutas para la partida de prueba
//*************************************************************************//

router.get('/0', (req,res,next) => {
    res.render('partida',{
        apodo: "antonio0",
        id_partida: 0, 
        tipo: "unir",
        modo_prueba: true,
        n_jugador: "jugador0"
    });
});
router.get('/1', (req,res,next) => {
    res.render('partida',{
        apodo: "bernardo1",
        id_partida: 0, 
        tipo: "unir",
        modo_prueba: true,
        n_jugador: "jugador1"
    });
});
router.get('/2', (req,res,next) => {
    res.render('partida',{
        apodo: "castor2",
        id_partida: 0, 
        tipo: "unir",
        modo_prueba: true,
        n_jugador: "jugador2"
    });
});
router.get('/3', (req,res,next) => {
    res.render('partida',{
        apodo: "dani3",
        id_partida: 0, 
        tipo: "unir",
        modo_prueba: true,
        n_jugador: "jugador3"
    });
});



export default router;