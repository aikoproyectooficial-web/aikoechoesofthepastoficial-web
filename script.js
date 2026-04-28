// 1. Datos de los personajes EXPANDIDOS
const personajesAiko = [
    { id: 1, nombre: "Aiko Guerrero", ataque: 5, vida: 5, costo: 1 },
    { id: 2, nombre: "Aiko Mago", ataque: 7, vida: 3, costo: 2 },
    { id: 3, nombre: "Aiko Guardián", ataque: 2, vida: 8, costo: 3 },
    { id: 4, nombre: "Aiko Asesino", ataque: 10, vida: 1, costo: 2 },
    { id: 5, nombre: "Aiko Muralla", ataque: 1, vida: 15, costo: 4 },
    { id: 6, nombre: "Aiko Aprendiz", ataque: 2, vida: 2, costo: 1 },
    { id: 7, nombre: "Aiko Berserker", ataque: 8, vida: 8, costo: 5 },
    { id: 8, nombre: "Aiko Arquero", ataque: 4, vida: 2, costo: 1 },
    { id: 9, nombre: "Aiko Coloso", ataque: 12, vida: 12, costo: 10 }
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

// 3. Interfaz
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
                
                // --- CAMBIO AQUÍ ---
                // La carta entra gris (mareo) SIEMPRE que la pongas tú en tu turno.
                cartaDiv.style.filter = "grayscale(100%)";
                cartasQueYaAtacaron.push(cartaDiv);

                actualizarInterfaz();
            } else {
                alert("No tienes suficiente maná");
            }
        } 
        else if (cartaDiv.parentElement === campoJugador) {
            // Verificamos si está en la lista de bloqueadas
            if (cartasQueYaAtacaron.includes(cartaDiv)) {
                alert("Esta carta está descansando.");
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
    // --- CAMBIO AQUÍ: La IA también empieza gris ---
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

// 7. Lógica de Combate (Daño Arrollador y Visualización Real)
function resolverCombate(atacante, defensor) {
    let vidaDefensorActual = parseInt(defensor.elemento.querySelector('.vida').innerText);
    let vidaAtacanteActual = parseInt(atacante.elemento.querySelector('.vida').innerText);
    let ataqueAtacante = atacante.datos.ataque;
    let ataqueDefensor = defensor.datos.ataque;

    const dañoSobrante = ataqueAtacante - vidaDefensorActual;

    const nuevaVidaDefensor = Math.max(0, vidaDefensorActual - ataqueAtacante);
    const nuevaVidaAtacante = Math.max(0, vidaAtacanteActual - ataqueDefensor);

    // Actualizar visualmente
    defensor.elemento.querySelector('.vida').innerText = nuevaVidaDefensor;
    atacante.elemento.querySelector('.vida').innerText = nuevaVidaAtacante;
    
    defensor.datos.vidaActual = nuevaVidaDefensor;
    atacante.datos.vidaActual = nuevaVidaAtacante;

    if (dañoSobrante > 0) {
        vidaEnemiga = Math.max(0, vidaEnemiga - dañoSobrante);
    }

    if (nuevaVidaDefensor === 0) setTimeout(() => defensor.elemento.remove(), 200);
    if (nuevaVidaAtacante === 0) setTimeout(() => atacante.elemento.remove(), 200);

    atacante.elemento.style.filter = "grayscale(100%)";
    atacante.elemento.style.border = "3px solid #3e2723";
    cartasQueYaAtacaron.push(atacante.elemento);
    
    atacanteSeleccionado = null;
    actualizarInterfaz();
    if (vidaEnemiga <= 0) alert("¡Victoria!");
}

// 8. Sistema de Turnos e IA
async function terminarTurno() {
    const btn = document.getElementById('btn-terminar');
    btn.disabled = true;

    if (atacanteSeleccionado) {
        atacanteSeleccionado.elemento.style.border = "3px solid #3e2723";
        atacanteSeleccionado = null;
    }

    await turnoDelOponente();

    // Empieza turno del jugador
    if (manaMaximo < 10) manaMaximo++;
    manaActual = manaMaximo;
    
    activarMisCartas(); 
    robarCarta(); 
    btn.disabled = false;
    actualizarInterfaz();
}

function activarMisCartas() {
    const misCartas = campoJugador.querySelectorAll('.carta');
    misCartas.forEach(carta => {
        carta.style.filter = "none"; // Vuelve el color
    });
    cartasQueYaAtacaron = []; // Se limpia la lista de bloqueadas
}
// Añade esta función nueva
function activarCartasIA() {
    const cartasIA = campoOponente.querySelectorAll('.carta');
    cartasIA.forEach(carta => {
        // Solo quitamos el gris si NO es la que acaba de poner
        if (!carta.classList.contains('mareada-ia')) {
            carta.style.filter = "none";
        }
    });
}

// Y actualiza el inicio de turno de la IA
async function turnoDelOponente() {
    // 0. ¡DESPERTAR! Quitamos el gris a las que sobrevivieron al turno anterior
    activarCartasIA();

    let manaIA = manaEnemigoMaximo;
    const pagables = personajesAiko.filter(p => p.costo <= manaIA);

    // 1. Atacar con las que YA NO tienen gris
    const cartasListas = Array.from(campoOponente.querySelectorAll('.carta'))
                              .filter(c => c.style.filter === "none");
    
    for (let cartaElem of cartasListas) {
        await ejecutarAtaqueIA(cartaElem);
        await new Promise(res => setTimeout(res, 600));
        // Después de atacar, se vuelve a poner gris
        cartaElem.style.filter = "grayscale(100%)";
    }

    // 2. Bajar carta nueva (esta entrará gris por la función del punto 1)
    if (pagables.length > 0) {
        const pAzar = pagables[Math.floor(Math.random() * pagables.length)];
        const cartaE = crearCartaEnemiga({ ...pAzar, vidaActual: pAzar.vida });
        cartaE.classList.add('mareada-ia'); 
        campoOponente.appendChild(cartaE);
    }

    // 3. Limpiar la marca de "recién llegada" al final del turno
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

        const dañoAlJugador = ataqueIA - vidaObj;
        if (dañoAlJugador > 0) {
            vidaJugador = Math.max(0, vidaJugador - dañoAlJugador);
        }

        const nuevaVidaJugador = Math.max(0, vidaObj - ataqueIA);
        const nuevaVidaIA = Math.max(0, vidaIA - ataqueObj);

        objetivo.querySelector('.vida').innerText = nuevaVidaJugador;
        cartaElem.querySelector('.vida').innerText = nuevaVidaIA;

        if (nuevaVidaJugador === 0) objetivo.remove();
        if (nuevaVidaIA === 0) cartaElem.remove();
    } else {
        vidaJugador = Math.max(0, vidaJugador - ataqueIA);
    }

    setTimeout(() => { cartaElem.style.transform = "translateY(0)"; }, 300);
    actualizarInterfaz();
}

// 9. Yan-Ken-Po Inicial
function jugarSuerte(eleccionJugador) {
    const opciones = ['piedra', 'papel', 'tijera'];
    const eleccionIA = opciones[Math.floor(Math.random() * 3)];
    const resDiv = document.getElementById('resultado-suerte');
    
    let mensaje = `Elegiste ${eleccionJugador}. La IA eligió ${eleccionIA}. `;

    if (eleccionJugador === eleccionIA) {
        resDiv.innerText = mensaje + " ¡Empate! Repite.";
        return;
    }

    const ganaJugador = 
        (eleccionJugador === 'piedra' && eleccionIA === 'tijera') ||
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
        // La IA pone su carta (estará mareada por la nueva lógica)
        await terminarTurnoIA_Inicial(); 
        // Despertamos tus cartas de la mano para que puedas jugar
        activarMisCartas(); 
    } else {
        manaMaximo = 1;
        manaActual = 1;
    }
    actualizarInterfaz();
}
async function terminarTurnoIA_Inicial() {
    await turnoDelOponente(); 
    // Después de que la IA juegue su primer turno:
    manaEnemigoMaximo = 1; // La IA usó 1 de maná
    
    // Ahora te toca a ti, subes a 2 de maná (regla de segundo jugador)
    manaMaximo = 2; 
    manaActual = 2;
    
    robarCarta();
    actualizarInterfaz();
}
// 10. Ataque Directo
document.getElementById('heroe-oponente').onclick = () => {
    if (atacanteSeleccionado) {
        const hayCartas = campoOponente.querySelectorAll('.carta').length > 0;
        if (hayCartas) {
            alert("¡Limpia el campo primero!");
        } else {
            vidaEnemiga = Math.max(0, vidaEnemiga - atacanteSeleccionado.datos.ataque);
            atacanteSeleccionado.elemento.style.filter = "grayscale(100%)";
            atacanteSeleccionado.elemento.style.border = "3px solid #3e2723";
            cartasQueYaAtacaron.push(atacanteSeleccionado.elemento);
            atacanteSeleccionado = null;
            actualizarInterfaz();
            if (vidaEnemiga <= 0) alert("¡Victoria!");
        }
    }
};
function iniciarJuego() {
    // 1. Ocultamos el menú de inicio con una transición suave
    const menu = document.getElementById('pantalla-inicio');
    menu.style.opacity = '0';
    setTimeout(() => {
        menu.style.display = 'none';
        
        // 2. Solo cuando cerramos el menú, mostramos el Yan-Ken-Po
        // (Asegúrate de que el Yan-Ken-Po esté visible en el CSS/HTML)
        document.getElementById('modal-suerte').style.display = 'flex';
    }, 500);
}

function mostrarCreditos() {
    alert("AIKO CARD GAME\n\n1. Gana el Yan-Ken-Po para decidir quién empieza.\n2. Baja cartas usando tu maná.\n3. Espera un turno para que tus cartas puedan atacar (el mareo).\n4. ¡Reduce la vida del héroe enemigo a 0!");
}
// --- INICIO ---
prepararMazo();
robarCarta(); robarCarta(); robarCarta();
actualizarInterfaz();