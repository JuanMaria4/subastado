        if(this.tipo == 'ia'){  

            if(apuesta_mesa.puntos < this.subasta.puntos){ // Si su apuesta es mayor a la subasta actual   SUBE

                // le da a la subasta general los puntos de la subasta del jugador( los puntos de su mano y el palo)
                apuesta_mesa.puntos = this.subasta.puntos;
                apuesta_mesa.palo = this.subasta.palo;
                // se añade a la subasta general que ya ha hablado un jugador y el jugador que lleva la subasta de momento y se reduce en 1 los que ya han hbaldo
                apuesta_mesa.jugador = this.numero;
                apuesta_mesa.hablado++;

                // se añada a la subasta del jugador que el ha hablado
                this.subasta.hablado = true;

                mazo.subasta_obj.lanzar_bocadillo(this.numero, this.subasta.puntos, game.state.states.gameplay); // lanza el bocadillo qen el que dice los puntos que apuesta


            }else if(apuesta_mesa.puntos <= (this.subasta.puntos + 10)){ // si su apuesta podría ser mayor a la subasta actual   SUBE

                if((parseInt((Math.random() * (2 - 0) + 0),10)) == 1){
                    this.subasta.puntos = apuesta_mesa.puntos + 5;


                    apuesta_mesa.puntos = this.subasta.puntos;
                    apuesta_mesa.palo = this.subasta.palo;
                    apuesta_mesa.jugador = this.numero;
                    apuesta_mesa.hablado++;

                    this.subasta.hablado = true;

                    mazo.subasta_obj.lanzar_bocadillo(this.numero, this.subasta.puntos, game.state.states.gameplay);

                    }else{ // PASA

                        this.subasta.pasa = true;
                        apuesta_mesa.pasan++ ;
                        apuesta_mesa.hablado++;

                        this.subasta.hablado = true;
                        this.subasta.pasa = true;
                        apuesta_mesa.compa += this.equipo == 1 ? 3 : 1; // se suma a la var compa 3 si es del equipo contricante 1 si es del equipo nuestro

                        mazo.subasta_obj.lanzar_bocadillo(this.numero, 'PASO', game.state.states.gameplay);
                    }
            }else{ // Si su apuesta es menor a la apuesta acutal   PASA

                
                this.subasta.pasa = true;
                apuesta_mesa.pasan++;
                apuesta_mesa.hablado++;

                this.subasta.hablado = true;
                this.subasta.pasa = true;
                apuesta_mesa.compa += this.equipo == 1 ? 3 : 1;

                mazo.subasta_obj.lanzar_bocadillo(this.numero, 'PASO', game.state.states.gameplay);
            }


        }else{ // en caso de que el jugador no sea 'ia' lanza la interfaz de usuario donde este ya eligira su apuesta

            mazo.subasta_obj.crear_intefaz_subasta(game, apuesta_mesa);

            
        }

        
    }