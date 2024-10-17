const API_BASE_URL = "http://localhost:8081/api/usuarios";

// Función para manejar las respuestas del backend
async function handleResponse(response) {
    if (!response.ok) {
        const errorData = await response.json();
        let errorMessage = errorData.message || 'Error en la solicitud';
        throw new Error(errorMessage);
    }
    return await response.json();
}

// --- Funciones de Autenticación ---

// --- Función para el inicio de sesión ---
async function iniciarSesion() {
    const nombreUsuario = document.getElementById('nombreUsuario').value;
    const contrasena = document.getElementById('contrasena').value;
    const claveUnica = document.getElementById('claveUnica').value;

    try {
        const response = await fetch(API_BASE_URL + '/login', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: `nombreUsuario=${nombreUsuario}&contrasena=${contrasena}&claveUnica=${claveUnica}`
        });

        const data = await handleResponse(response);

        // Guardar el token y el ID del usuario en el localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('idUsuario', data.id); // Asegúrate de que este sea el ID correcto

        // Redirigir al dashboard
        window.location.href = "HTML/dashboard.html";

    } catch (error) {
        document.getElementById('mensajeError').textContent = error.message;
    }
}

function cerrarSesion() {
    localStorage.removeItem('token'); // Eliminar el token
    window.location.href = "index.html"; // Redirigir al login
}

// Función para registrar un nuevo usuario
async function registrarUsuario() {
    const nombreUsuario = document.getElementById('nombreUsuario').value;
    const contrasena = document.getElementById('contrasena').value;
    const nombreCompleto = document.getElementById('nombreCompleto').value;
    const fechaNacimiento = document.getElementById('fechaNacimiento').value;
    const sexo = document.getElementById('sexo').value;
    const pesoActual = parseFloat(document.getElementById('pesoActual').value);
    const altura = parseFloat(document.getElementById('altura').value);
    const imei = document.getElementById('imei').value;

    const usuarioData = {
        nombreUsuario: nombreUsuario,
        contrasena: contrasena,
        nombreCompleto: nombreCompleto,
        fechaNacimiento: fechaNacimiento,
        sexo: sexo,
        pesoActual: pesoActual,
        altura: altura,
        dispositivo: {
            imei: imei
        }
    };

    try {
        const response = await fetch(API_BASE_URL + '/registrar', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(usuarioData)
        });

        const data = await handleResponse(response);

        console.log('Usuario registrado:', data);
        // Redirigir al usuario a la página de login 
        window.location.href = "index.html";
    } catch (error) {
        document.getElementById('mensajeError').textContent = error.message;
    }
}

// --- Funciones del Dashboard --- 

// --- Obtener los datos del usuario ---
// --- Obtener los datos del usuario ---
async function obtenerDatosUsuario(token) {
    const idUsuario = localStorage.getItem('idUsuario'); // Obtener el id del usuario

    if (!token) {
        console.warn("No hay token, mostrando datos predeterminados.");
        // Aquí puedes asignar valores predeterminados si lo deseas
        document.getElementById('usuarioNombre').textContent = "Usuario sin datos"; // Mensaje si no hay token
        return; // Salimos de la función si no hay token
    }

    try {
        const response = await fetch(`${API_BASE_URL}/perfil/${idUsuario}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}` 
            }
        });

        const usuario = await handleResponse(response);

        document.getElementById('usuarioNombre').textContent = usuario.nombreCompleto;
        // ... (mostrar otros datos del usuario en el dashboard)
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
    }
}


// --- Obtener la información de salud ---
async function obtenerInformacionSalud(token) {
    const idUsuario = localStorage.getItem('idUsuario'); // Obtener el id del usuario

    try {
        const response = await fetch(`${API_BASE_URL}/salud/${idUsuario}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const saludData = await handleResponse(response);

        document.getElementById('imcValor').textContent = saludData.imc;
        document.getElementById('pesoIdealValor').textContent = saludData.pesoIdeal;
        document.getElementById('presionArterialIdealValor').textContent = saludData.presionArterialIdeal;

    } catch (error) {
        console.error("Error al obtener información de salud:", error);
    }
}

// --- Funciones del Administrador ---

// Obtener la lista de usuarios (para el administrador)
async function obtenerUsuarios() {
    try {
        const token = localStorage.getItem('token'); // Obtener el token del administrador
        const response = await fetch(API_BASE_URL, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const usuarios = await handleResponse(response);
        mostrarUsuariosEnTabla(usuarios);
    } catch (error) {
        console.error("Error al obtener la lista de usuarios:", error);
    }
}

// Mostrar la lista de usuarios en la tabla del administrador
function mostrarUsuariosEnTabla(usuarios) {
    const tablaUsuarios = document.getElementById('tablaUsuarios').getElementsByTagName('tbody')[0];
    tablaUsuarios.innerHTML = ''; // Limpiar la tabla

    usuarios.forEach(usuario => {
        const row = tablaUsuarios.insertRow();
        const idCell = row.insertCell();
        const nombreUsuarioCell = row.insertCell();
        const estadoCell = row.insertCell();
        const accionesCell = row.insertCell();

        idCell.textContent = usuario.id;
        nombreUsuarioCell.textContent = usuario.nombreUsuario;
        estadoCell.textContent = usuario.dispositivo.activo ? 'Activo' : 'Inactivo';

        // Crear botones de acción (desactivar/activar)
        const btnActivarDesactivar = document.createElement('button');
        btnActivarDesactivar.textContent = usuario.dispositivo.activo ? 'Desactivar' : 'Activar';
        btnActivarDesactivar.addEventListener('click', async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await fetch(API_BASE_URL + `/${usuario.id}/${usuario.dispositivo.activo ? 'desactivar' : 'activar'}`, {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (response.ok) {
                    // Actualizar el estado en la tabla después de la acción
                    estadoCell.textContent = usuario.dispositivo.activo ? 'Inactivo' : 'Activo';
                    usuario.dispositivo.activo = !usuario.dispositivo.activo; // Actualizar el estado localmente
                    btnActivarDesactivar.textContent = usuario.dispositivo.activo ? 'Desactivar' : 'Activar';
                } else {
                    console.error("Error al actualizar el estado del usuario");
                    // Manejar el error (mostrar un mensaje, etc.)
                }
            } catch (error) {
                console.error("Error al actualizar el estado del usuario:", error);
                // Manejar el error
            }
        });

        accionesCell.appendChild(btnActivarDesactivar);
        row.appendChild(accionesCell);
    });
}

