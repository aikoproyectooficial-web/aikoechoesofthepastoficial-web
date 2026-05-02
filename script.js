// 1. Datos de los personajes y cartas
const personajesAiko = [
    { id: 1, nombre: "Centinela", ataque: 5, vida: 5, costo: 1 },
    { id: 2, nombre: "Mafioso", ataque: 7, vida: 3, costo: 2 },
    { id: 3, nombre: "Elite", ataque: 2, vida: 8, costo: 3 },
    { id: 4, nombre: "Traidor", ataque: 10, vida: 1, costo: 2 },
    { id: 5, nombre: "Muralla", ataque: 1, vida: 15, costo: 4 },
    { id: 6, nombre: "Centinela Novato", ataque: 2, vida: 2, costo: 1 },
    { id: 7, nombre: "Asesino", ataque: 8, vida: 8, costo: 5 },
    { id: 8, nombre: "Artillero", ataque: 4, vida: 2, costo: 1 },
    { id: 9, nombre: "Coloso", ataque: 12, vida: 12, costo: 10 }
];

const cartasEspeciales = [
    { id: 101, nombre: "Poción Ancestral+10 VIDA", efecto: "curar", valor: 10, costo: 2, tipo: "magica" },
    { id: 102, nombre: "Escudo Rúnico+5 VIDA", efecto: "curar", valor: 5, costo: 1, tipo: "magica" }
];

// 2. Estado del Juego
let manaActual = 1; 
let manaMaximo = 1;
let manaEnemigoMaximo = 1; 
let vidaEnemiga = 30;
let vidaJugador = 30; 
let mazo = []; 
let mazoEnemigo = [];
let cartasQueYaAtacaron = []; 
let atacanteSeleccionado = null; 
let manoEnemigaData = [];
let turnoGlobal = 1; // <--- NUEVA VARIABLE PARA CONTROLAR EL PRIMER TURNO

const manoContenedor = document.getElementById('mano-jugador');
const campoJugador = document.getElementById('campo-jugador');
const campoOponente = document.getElementById('campo-oponente');
const mazoContador = document.getElementById('cartas-restantes');

// --- FUNCIONES DE INTERFAZ ---

function actualizarInterfaz() {
    document.getElementById('mana-display').innerText = `${manaActual} / ${manaMaximo}`;
    document.getElementById('vida-enemiga').innerText = vidaEnemiga;
    document.getElementById('vida-jugador').innerText = vidaJugador;
    
    // Tu contador
    if(mazoContador) mazoContador.innerText = mazo.length;

    // CONTADOR ENEMIGO (NUEVO)
    const mazoEnemigoContador = document.getElementById('cartas-restantes-enemigo');
    if(mazoEnemigoContador) mazoEnemigoContador.innerText = mazoEnemigo.length;
}

function mostrarAviso(mensaje) {
    const aviso = document.getElementById('notificacion-flotante');
    if(aviso) {
        aviso.innerText = mensaje;
        aviso.style.display = 'block';
        setTimeout(() => { aviso.style.display = 'none'; }, 1500);
    }
}

function finalizarPartida(resultado) {
    const pantalla = document.getElementById('pantalla-final');
    const texto = document.getElementById('mensaje-final');
    if(pantalla && texto) {
        if (resultado === "victoria") {
            texto.innerText = "¡VICTORIA!";
            texto.style.color = "#0fd7f1";
        } else {
            texto.innerText = "DERROTA";
            texto.style.color = "#e74c3c";
        }
        pantalla.style.display = 'flex';
    }
}

// --- LÓGICA DE CARTAS ---

function prepararMazo() {
    mazo = [];
    mazoEnemigo = []; // Limpiamos mazo enemigo
    const poolDeCartas = [...personajesAiko, ...cartasEspeciales];
    for (let i = 0; i < 20; i++) {
        // Tu mazo
        const azar = poolDeCartas[Math.floor(Math.random() * poolDeCartas.length)];
        mazo.push({ ...azar, vidaActual: azar.vida || 0 }); 

        // Mazo enemigo (NUEVO)
        const azarE = poolDeCartas[Math.floor(Math.random() * poolDeCartas.length)];
        mazoEnemigo.push({ ...azarE, vidaActual: azarE.vida || 0 });
    }
}
function robarCarta() {
    if (mazo.length > 0) {
        const datos = mazo.pop();
        const cartaDiv = crearCarta(datos);
        manoContenedor.appendChild(cartaDiv);
        actualizarInterfaz();
    }
}

function crearCarta(personaje) {
    const cartaDiv = document.createElement('div');
    cartaDiv.className = personaje.tipo === "magica" ? 'carta magia' : 'carta';

    if (personaje.tipo === "magica") {
        cartaDiv.innerHTML = `
            <div class="stat costo">${personaje.costo}</div>
            <h4>${personaje.nombre}</h4>
            <p style="font-size:0.7em; margin-top:35px; font-weight:bold;">MAGIA</p>
        `;
    } else {
        cartaDiv.innerHTML = `
            <div class="stat costo">${personaje.costo}</div>
            <h4>${personaje.nombre}</h4>
            <div class="stat ataque">${personaje.ataque}</div>
            <div class="stat vida">${personaje.vidaActual}</div>
        `;
    }

    cartaDiv.onclick = (e) => {
        e.stopPropagation();
        if (cartaDiv.parentElement === manoContenedor) {
            if (manaActual >= personaje.costo) {
                if (personaje.tipo !== "magica" && campoJugador.querySelectorAll('.carta').length >= 7) {
                    mostrarAviso("Tablero lleno (Máx 7)");
                    return;
                }

                manaActual -= personaje.costo;
                if (personaje.tipo === "magica") {
                    const campoMagia = document.getElementById('campo-magia-jugador');
                    campoMagia.appendChild(cartaDiv);
                    ejecutarEfectoMagia(personaje);
                    setTimeout(() => {
                        cartaDiv.style.opacity = "0";
                        setTimeout(() => cartaDiv.remove(), 500);
                    }, 2000);
                } else {
                    campoJugador.appendChild(cartaDiv);
                    cartaDiv.style.filter = "grayscale(100%)";
                    cartasQueYaAtacaron.push(cartaDiv);
                }
                actualizarInterfaz();
            } else {
                mostrarAviso("¡No tienes suficiente maná!");
            }
        } 
        else if (cartaDiv.parentElement === campoJugador) {
            // REGLA: Si es el turno 1 del jugador, no puede atacar
            if (turnoGlobal === 1) {
                mostrarAviso("No puedes atacar en el primer turno");
                return;
            }
            if (cartasQueYaAtacaron.includes(cartaDiv)) {
                mostrarAviso("Esta carta ya actuó este turno");
                return;
            }
            if (atacanteSeleccionado) atacanteSeleccionado.elemento.style.border = "none";
            atacanteSeleccionado = { elemento: cartaDiv, datos: personaje };
            cartaDiv.style.border = "3px solid #ff9800";
        }
    };
    return cartaDiv;
}

function crearCartaEnemiga(personaje) {
    const cartaDiv = document.createElement('div');
    cartaDiv.className = 'carta';
    cartaDiv.style.filter = "grayscale(100%)"; 
    cartaDiv.style.background = "linear-gradient(135deg, #7b241c, #1a242f)";
    cartaDiv.innerHTML = `
        <div class="stat costo">${personaje.costo}</div>
        <h4>${personaje.nombre}</h4>
        <div class="stat ataque">${personaje.ataque}</div>
        <div class="stat vida">${personaje.vidaActual}</div>
    `;
    cartaDiv.onclick = (e) => {
        e.stopPropagation();
        if (atacanteSeleccionado) {
            resolverCombate(atacanteSeleccionado, { elemento: cartaDiv, datos: personaje });
        }
    };
    return cartaDiv;
}

// --- ACCIONES DE JUEGO ---

function resolverCombate(atacante, defensor) {
    let vidaDefensorActual = parseInt(defensor.elemento.querySelector('.vida').innerText);
    let vidaAtacanteActual = parseInt(atacante.elemento.querySelector('.vida').innerText);
    
    const nuevaVidaDefensor = Math.max(0, vidaDefensorActual - atacante.datos.ataque);
    const nuevaVidaAtacante = Math.max(0, vidaAtacanteActual - defensor.datos.ataque);

    defensor.elemento.querySelector('.vida').innerText = nuevaVidaDefensor;
    atacante.elemento.querySelector('.vida').innerText = nuevaVidaAtacante;
    
    defensor.datos.vidaActual = nuevaVidaDefensor;
    atacante.datos.vidaActual = nuevaVidaAtacante;

    if (nuevaVidaDefensor === 0) setTimeout(() => defensor.elemento.remove(), 200);
    if (nuevaVidaAtacante === 0) setTimeout(() => atacante.elemento.remove(), 200);

    atacante.elemento.style.filter = "grayscale(100%)";
    atacante.elemento.style.border = "none";
    cartasQueYaAtacaron.push(atacante.elemento);
    
    atacanteSeleccionado = null;
    actualizarInterfaz();
    if (vidaEnemiga <= 0) finalizarPartida("victoria");
}

function ejecutarEfectoMagia(datos) {
    if (datos.efecto === "curar") {
        vidaJugador += datos.valor;
        mostrarAviso(`¡Usaste ${datos.nombre}! +${datos.valor} de Vida`);
    }
    actualizarInterfaz();
}

async function terminarTurno() {
    const btn = document.getElementById('btn-terminar');
    btn.disabled = true;
    if (atacanteSeleccionado) {
        atacanteSeleccionado.elemento.style.border = "none";
        atacanteSeleccionado = null;
    }
    
    turnoGlobal++; // Aumentamos el turno global
    
    await turnoDelOponente();
    if (manaMaximo < 10) manaMaximo++;
    manaActual = manaMaximo;
    activarMisCartas(); 
    robarCarta(); 
    btn.disabled = false;
    actualizarInterfaz();
}

function activarMisCartas() {
    const misCartas = campoJugador.querySelectorAll('.carta');
    misCartas.forEach(carta => { carta.style.filter = "none"; });
    cartasQueYaAtacaron = [];
}

// --- LÓGICA DE LA IA ---

function robarCartaIA() {
    // Si la mano no está llena y hay cartas en su mazo
    if (manoEnemigaData.length < 7 && mazoEnemigo.length > 0) { 
        const datos = mazoEnemigo.pop(); // SACA LA CARTA DEL MAZO REAL
        manoEnemigaData.push(datos);
        
        const manoDiv = document.getElementById('mano-oponente');
        if (manoDiv) {
            const dorso = document.createElement('div');
            dorso.className = 'carta-oculta';
            manoDiv.appendChild(dorso);
        }
        actualizarInterfaz(); // Esto hará que el número 20 baje a 19, etc.
    }
}

function crearCartaVisualIA(datos) {
    const div = document.createElement('div');
    div.className = datos.tipo === "magica" ? 'carta magia' : 'carta';
    if (datos.tipo === "magica") {
        div.innerHTML = `<div class="stat costo">${datos.costo}</div><h4>${datos.nombre}</h4><p style="font-size:0.7em; margin-top:35px; font-weight:bold;">MAGIA</p>`;
    } else {
        div.innerHTML = `<div class="stat costo">${datos.costo}</div><h4>${datos.nombre}</h4><div class="stat ataque">${datos.ataque}</div><div class="stat vida">${datos.vidaActual}</div>`;
    }
    return div;
}

async function turnoDelOponente() {
    let manaIA = manaEnemigoMaximo;
    const campoMagiaIA = document.getElementById('campo-magia-oponente');
    const manoIAVisual = document.getElementById('mano-oponente');

    // 1. Invocar
    for (let i = 0; i < manoEnemigaData.length; i++) {
        let cartaData = manoEnemigaData[i];
        if (manaIA >= cartaData.costo) {
            if (cartaData.tipo === "magica") {
                manaIA -= cartaData.costo;
                const cartaVisual = crearCartaVisualIA(cartaData);
                campoMagiaIA.appendChild(cartaVisual);
                vidaEnemiga += cartaData.valor || 0;
                manoEnemigaData.splice(i, 1);
                if (manoIAVisual.lastChild) manoIAVisual.lastChild.remove();
                await new Promise(res => setTimeout(res, 1000));
                cartaVisual.remove();
                i--; 
            } else {
                if (campoOponente.querySelectorAll('.carta').length < 7) {
                    manaIA -= cartaData.costo;
                    const cartaE = crearCartaEnemiga(cartaData);
                    campoOponente.appendChild(cartaE);
                    manoEnemigaData.splice(i, 1);
                    if (manoIAVisual.lastChild) manoIAVisual.lastChild.remove();
                    i--;
                    await new Promise(res => setTimeout(res, 600));
                }
            }
        }
    }

    // 2. Atacar (REGLA: No atacar si es el primer turno del juego)
    if (turnoGlobal > 1) {
        const cartasIA = campoOponente.querySelectorAll('.carta');
        for (let cartaElem of cartasIA) {
            await ejecutarAtaqueIA(cartaElem);
            await new Promise(res => setTimeout(res, 600));
        }
    } else {
        mostrarAviso("IA no puede atacar en Turno 1");
    }

    if (manaEnemigoMaximo < 10) manaEnemigoMaximo++;
    robarCartaIA(); 
}

async function ejecutarAtaqueIA(cartaElem) {
    const misEsbirros = campoJugador.querySelectorAll('.carta');
    // Obtenemos ataque y vida de la carta de la IA
    let ataqueIA = parseInt(cartaElem.querySelector('.ataque').innerText);
    let vidaIA = parseInt(cartaElem.querySelector('.vida').innerText);
    
    cartaElem.style.transform = "translateY(20px)"; // Animación de embestida
    
    if (misEsbirros.length > 0) {
        // La IA elige un objetivo aleatorio de tus esbirros
        const objetivo = misEsbirros[Math.floor(Math.random() * misEsbirros.length)];
        let ataqueJugador = parseInt(objetivo.querySelector('.ataque').innerText);
        let vidaJugadorCarta = parseInt(objetivo.querySelector('.vida').innerText);

        // 1. Calcular nuevas vidas (Combate simultáneo)
        const nuevaVidaJugador = Math.max(0, vidaJugadorCarta - ataqueIA);
        const nuevaVidaIA = Math.max(0, vidaIA - ataqueJugador);

        // 2. Aplicar daño visualmente
        objetivo.querySelector('.vida').innerText = nuevaVidaJugador;
        cartaElem.querySelector('.vida').innerText = nuevaVidaIA;

        // 3. Eliminar cartas muertas
        if (nuevaVidaJugador === 0) {
            setTimeout(() => objetivo.remove(), 200);
        }
        
        if (nuevaVidaIA === 0) {
            // ¡Tu monstruo logró defenderse y matar al atacante!
            setTimeout(() => {
                cartaElem.remove();
                mostrarAviso("¡Tu esbirro destruyó al atacante!");
            }, 200);
        }
    } else {
        // Si no tienes esbirros, el daño va directo a tu héroe
        vidaJugador = Math.max(0, vidaJugador - ataqueIA);
        if (vidaJugador <= 0) finalizarPartida("derrota");
    }

    setTimeout(() => { cartaElem.style.transform = "translateY(0)"; }, 300);
    actualizarInterfaz();
}

// --- SISTEMA DE INICIO Y SUERTE ---

function iniciarJuego() {
    document.getElementById('pantalla-inicio').style.display = 'none';
    document.getElementById('modal-suerte').style.display = 'flex';
}

function jugarSuerte(eleccionJugador) {
    const opciones = ['piedra', 'papel', 'tijera'];
    const eleccionIA = opciones[Math.floor(Math.random() * 3)];
    const resDiv = document.getElementById('resultado-suerte');
    let mensaje = `Elegiste ${eleccionJugador}. IA eligió ${eleccionIA}. `;

    if (eleccionJugador === eleccionIA) {
        resDiv.innerText = mensaje + " ¡Empate! Repite.";
        return;
    }

    const ganaJugador = (eleccionJugador === 'piedra' && eleccionIA === 'tijera') ||
                        (eleccionJugador === 'papel' && eleccionIA === 'piedra') ||
                        (eleccionJugador === 'tijera' && eleccionIA === 'papel');

    if (ganaJugador) {
        resDiv.innerHTML = mensaje + "<br><b>¡GANASTE EL SORTEO!</b><br>¿Quién empieza?<br>" +
            "<button onclick='setPrimerTurno(true)' style='padding:10px; margin:5px;'>Empezar Yo</button>" +
            "<button onclick='setPrimerTurno(false)' style='padding:10px; margin:5px;'>Que empiece la IA</button>";
    } else {
        resDiv.innerHTML = mensaje + "<br><b>PERDISTE EL SORTEO...</b><br>La IA ha decidido empezar ella.";
        setTimeout(() => setPrimerTurno(false), 2000);
    }
}

async function setPrimerTurno(empiezoYo) {
    document.getElementById('modal-suerte').style.display = "none"; 
    if (!empiezoYo) {
        // Turno 1: IA
        await turnoDelOponente();
        // Después de que la IA use su turno 1, pasamos al turno del jugador
        turnoGlobal++; 
        manaMaximo = 1; manaActual = 1;
    } else {
        // Turno 1: Jugador
        manaMaximo = 1; manaActual = 1;
    }
    actualizarInterfaz();
}

function volverAlMenu() {
    location.reload();
}

function mostrarCreditos() {
    mostrarAviso("AIKO: Gana bajando la vida enemiga a 0.");
}

document.getElementById('heroe-oponente').onclick = () => {
    if (atacanteSeleccionado) {
        // REGLA: Jugador no ataca en turno 1
        if (turnoGlobal === 1) {
            mostrarAviso("No puedes atacar en el primer turno");
            return;
        }
        if (campoOponente.querySelectorAll('.carta').length > 0) {
            mostrarAviso("¡Limpia el campo primero!");
        } else {
            vidaEnemiga = Math.max(0, vidaEnemiga - atacanteSeleccionado.datos.ataque);
            atacanteSeleccionado.elemento.style.filter = "grayscale(100%)";
            cartasQueYaAtacaron.push(atacanteSeleccionado.elemento);
            atacanteSeleccionado.elemento.style.border = "none";
            atacanteSeleccionado = null;
            actualizarInterfaz();
            if (vidaEnemiga <= 0) finalizarPartida("victoria");
        }
    }
};

// --- INICIALIZACIÓN ---
prepararMazo();
for(let i=0; i<3; i++) { robarCartaIA(); robarCarta(); }
actualizarInterfaz();