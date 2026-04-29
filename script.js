// 1. Datos de los personajes
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

// 2. Estado del Juego
let manaActual = 1; 
let manaMaximo = 1;
let manaEnemigoMaximo = 1; 
let vidaEnemiga = 30;
let vidaJugador = 30; 
let mazo = []; 
let cartasQueYaAtacaron = []; 
let atacanteSeleccionado = null; 

const manoContenedor = document.getElementById('mano-jugador');
const campoJugador = document.getElementById('campo-jugador');
const campoOponente = document.getElementById('campo-oponente');
const mazoContador = document.getElementById('cartas-restantes');

// --- NUEVAS FUNCIONES DE INTERFAZ (SIN ALERTS) ---
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
            texto.style.color = "#f1c40f";
        } else {
            texto.innerText = "DERROTA";
            texto.style.color = "#e74c3c";
        }
        pantalla.style.display = 'flex';
    }
}

// 3. Interfaz básica
function actualizarInterfaz() {
    document.getElementById('mana-display').innerText = `${manaActual} / ${manaMaximo}`;
    document.getElementById('vida-enemiga').innerText = vidaEnemiga;
    document.getElementById('vida-jugador').innerText = vidaJugador;
    if(mazoContador) mazoContador.innerText = mazo.length;
}

// 4. Sistema de Mazo
function prepararMazo() {
    mazo = [];
    for (let i = 0; i < 20; i++) {
        const azar = personajesAiko[Math.floor(Math.random() * personajesAiko.length)];
        mazo.push({ ...azar, vidaActual: azar.vida }); 
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
    cartaDiv.className = 'carta';
    cartaDiv.innerHTML = `
        <div class="stat costo">${personaje.costo}</div>
        <h4>${personaje.nombre}</h4>
        <div class="stat ataque">${personaje.ataque}</div>
        <div class="stat vida">${personaje.vidaActual}</div>
    `;

    cartaDiv.onclick = (e) => {
        e.stopPropagation();
        if (cartaDiv.parentElement === manoContenedor) {
            if (manaActual >= personaje.costo) {
                manaActual -= personaje.costo;
                campoJugador.appendChild(cartaDiv);
                cartaDiv.style.filter = "grayscale(100%)";
                cartasQueYaAtacaron.push(cartaDiv);
                actualizarInterfaz();
            } else {
                mostrarAviso("¡No tienes suficiente maná!");
            }
        } 
        else if (cartaDiv.parentElement === campoJugador) {
            if (cartasQueYaAtacaron.includes(cartaDiv)) {
                mostrarAviso("Esta carta está descansando...");
                return;
            }
            if (atacanteSeleccionado) atacanteSeleccionado.elemento.style.border = "3px solid #3e2723";
            atacanteSeleccionado = { elemento: cartaDiv, datos: personaje };
            cartaDiv.style.border = "4px solid yellow"; 
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

function resolverCombate(atacante, defensor) {
    let vidaDefensorActual = parseInt(defensor.elemento.querySelector('.vida').innerText);
    let vidaAtacanteActual = parseInt(atacante.elemento.querySelector('.vida').innerText);
    let ataqueAtacante = atacante.datos.ataque;
    let ataqueDefensor = defensor.datos.ataque;

    const nuevaVidaDefensor = Math.max(0, vidaDefensorActual - ataqueAtacante);
    const nuevaVidaAtacante = Math.max(0, vidaAtacanteActual - ataqueDefensor);

    defensor.elemento.querySelector('.vida').innerText = nuevaVidaDefensor;
    atacante.elemento.querySelector('.vida').innerText = nuevaVidaAtacante;
    
    defensor.datos.vidaActual = nuevaVidaDefensor;
    atacante.datos.vidaActual = nuevaVidaAtacante;

    if (nuevaVidaDefensor === 0) setTimeout(() => defensor.elemento.remove(), 200);
    if (nuevaVidaAtacante === 0) setTimeout(() => atacante.elemento.remove(), 200);

    atacante.elemento.style.filter = "grayscale(100%)";
    atacante.elemento.style.border = "3px solid #3e2723";
    cartasQueYaAtacaron.push(atacante.elemento);
    
    atacanteSeleccionado = null;
    actualizarInterfaz();
    if (vidaEnemiga <= 0) finalizarPartida("victoria");
}

async function terminarTurno() {
    const btn = document.getElementById('btn-terminar');
    btn.disabled = true;
    if (atacanteSeleccionado) {
        atacanteSeleccionado.elemento.style.border = "3px solid #3e2723";
        atacanteSeleccionado = null;
    }
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

function activarCartasIA() {
    const cartasIA = campoOponente.querySelectorAll('.carta');
    cartasIA.forEach(carta => {
        if (!carta.classList.contains('mareada-ia')) {
            carta.style.filter = "none";
        }
    });
}

async function turnoDelOponente() {
    activarCartasIA();
    let manaIA = manaEnemigoMaximo;
    const pagables = personajesAiko.filter(p => p.costo <= manaIA);

    const cartasListas = Array.from(campoOponente.querySelectorAll('.carta'))
                              .filter(c => c.style.filter === "none");
    
    for (let cartaElem of cartasListas) {
        await ejecutarAtaqueIA(cartaElem);
        await new Promise(res => setTimeout(res, 600));
        if (cartaElem.parentElement) cartaElem.style.filter = "grayscale(100%)";
    }

    if (pagables.length > 0) {
        const pAzar = pagables[Math.floor(Math.random() * pagables.length)];
        const cartaE = crearCartaEnemiga({ ...pAzar, vidaActual: pAzar.vida });
        cartaE.classList.add('mareada-ia'); 
        campoOponente.appendChild(cartaE);
    }

    setTimeout(() => {
        const todas = campoOponente.querySelectorAll('.carta');
        todas.forEach(c => c.classList.remove('mareada-ia'));
    }, 500);

    if (manaEnemigoMaximo < 10) manaEnemigoMaximo++;
}

async function ejecutarAtaqueIA(cartaElem) {
    const misEsbirros = campoJugador.querySelectorAll('.carta');
    const ataqueIA = parseInt(cartaElem.querySelector('.ataque').innerText);
    const vidaIA = parseInt(cartaElem.querySelector('.vida').innerText);

    cartaElem.style.transform = "translateY(20px)";
    
    if (misEsbirros.length > 0) {
        const objetivo = misEsbirros[Math.floor(Math.random() * misEsbirros.length)];
        const ataqueObj = parseInt(objetivo.querySelector('.ataque').innerText);
        const vidaObj = parseInt(objetivo.querySelector('.vida').innerText);

        const nuevaVidaJugador = Math.max(0, vidaObj - ataqueIA);
        const nuevaVidaIA = Math.max(0, vidaIA - ataqueObj);

        objetivo.querySelector('.vida').innerText = nuevaVidaJugador;
        cartaElem.querySelector('.vida').innerText = nuevaVidaIA;

        if (nuevaVidaJugador === 0) setTimeout(() => objetivo.remove(), 200);
        if (nuevaVidaIA === 0) setTimeout(() => cartaElem.remove(), 200);
    } else {
        vidaJugador = Math.max(0, vidaJugador - ataqueIA);
        if (vidaJugador <= 0) finalizarPartida("derrota");
    }

    setTimeout(() => { if(cartaElem.parentElement) cartaElem.style.transform = "translateY(0)"; }, 300);
    actualizarInterfaz();
}

function jugarSuerte(eleccionJugador) {
    const opciones = ['piedra', 'papel', 'tijera'];
    const eleccionIA = opciones[Math.floor(Math.random() * 3)];
    const resDiv = document.getElementById('resultado-suerte');
    let mensaje = `Elegiste ${eleccionJugador}. La IA eligió ${eleccionIA}. `;

    if (eleccionJugador === eleccionIA) {
        resDiv.innerText = mensaje + " ¡Empate! Repite.";
        return;
    }

    const ganaJugador = (eleccionJugador === 'piedra' && eleccionIA === 'tijera') ||
                        (eleccionJugador === 'papel' && eleccionIA === 'piedra') ||
                        (eleccionJugador === 'tijera' && eleccionIA === 'papel');

    if (ganaJugador) {
        resDiv.innerHTML = mensaje + "<br><b>¡GANASTE!</b><br>" +
            "<button onclick='setPrimerTurno(true)' style='margin:10px;'>Yo empiezo</button>" +
            "<button onclick='setPrimerTurno(false)' style='margin:10px;'>Que empiece la IA</button>";
    } else {
        resDiv.innerHTML = mensaje + "<br><b>PERDISTE...</b><br>La IA ha decidido empezar ella.";
        setTimeout(() => setPrimerTurno(false), 2000);
    }
}

async function setPrimerTurno(empiezoYo) {
    document.getElementById('modal-suerte').style.display = "none"; 
    if (!empiezoYo) {
        await terminarTurnoIA_Inicial(); 
        activarMisCartas(); 
    } else {
        manaMaximo = 1;
        manaActual = 1;
    }
    actualizarInterfaz();
}

async function terminarTurnoIA_Inicial() {
    await turnoDelOponente(); 
    manaEnemigoMaximo = 1; 
    manaMaximo = 2; 
    manaActual = 2;
    robarCarta();
    actualizarInterfaz();
}

document.getElementById('heroe-oponente').onclick = () => {
    if (atacanteSeleccionado) {
        const hayCartas = campoOponente.querySelectorAll('.carta').length > 0;
        if (hayCartas) {
            mostrarAviso("¡Limpia el campo primero!");
        } else {
            vidaEnemiga = Math.max(0, vidaEnemiga - atacanteSeleccionado.datos.ataque);
            atacanteSeleccionado.elemento.style.filter = "grayscale(100%)";
            atacanteSeleccionado.elemento.style.border = "3px solid #3e2723";
            cartasQueYaAtacaron.push(atacanteSeleccionado.elemento);
            atacanteSeleccionado = null;
            actualizarInterfaz();
            if (vidaEnemiga <= 0) finalizarPartida("victoria");
        }
    }
};

function iniciarJuego() {
    const menu = document.getElementById('pantalla-inicio');
    menu.style.opacity = '0';
    setTimeout(() => {
        menu.style.display = 'none';
        document.getElementById('modal-suerte').style.display = 'flex';
    }, 500);
}

function mostrarCreditos() {
    mostrarAviso("AIKO: Gana bajando la vida enemiga a 0.");
}


function volverAlMenu() {
    // 1. Resetear variables de estado
    vidaJugador = 30;
    vidaEnemiga = 30;
    manaMaximo = 1;
    manaActual = 1;
    manaEnemigoMaximo = 1;
    cartasQueYaAtacaron = [];
    atacanteSeleccionado = null;

    // 2. Limpiar el tablero visualmente
    manoContenedor.innerHTML = "";
    campoJugador.innerHTML = "";
    campoOponente.innerHTML = "";

    // 3. Ocultar pantallas finales y mostrar el inicio
    document.getElementById('pantalla-final').style.display = 'none';
    const menuInicio = document.getElementById('pantalla-inicio');
    menuInicio.style.display = 'flex';
    menuInicio.style.opacity = '1';

    // 4. Preparar mazo nuevo y actualizar textos
    prepararMazo();
    robarCarta(); robarCarta(); robarCarta();
    actualizarInterfaz();
}

// --- INICIO ---
prepararMazo();
robarCarta(); robarCarta(); robarCarta();
actualizarInterfaz();