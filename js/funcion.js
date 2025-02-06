// Funciones existentes
function guardarFactura(cliente, monto, fecha) {
    const facturas = obtenerFacturas();
    const nuevaFactura = { id: generarID(), cliente, monto, fecha: fecha.toISOString() };
    facturas.push(nuevaFactura);

    // Convertir el array de facturas a una cadena JSON antes de almacenarlo
    localStorage.setItem('facturas', JSON.stringify(facturas));
}

function obtenerFacturas() {
    let facturas;
    try {
        facturas = JSON.parse(localStorage.getItem('facturas'));
    } catch (error) {
        console.error('Error al obtener facturas:', error);
        facturas = [];
    }
    if (!Array.isArray(facturas)) {
        facturas = [];
    }
    return facturas.map(factura => ({
        ...factura,
        fecha: new Date(factura.fecha)
    }));
}

function mostrarFacturas() {
    const facturas = obtenerFacturas();
    const tableBody = document.getElementById('facturasTable').getElementsByTagName('tbody')[0];
    tableBody.innerHTML = '';  // Limpiar la tabla antes de mostrar las nuevas facturas

    facturas.forEach(factura => {
        const row = tableBody.insertRow(-1);
        row.insertCell(0).textContent = factura.id;
        row.insertCell(1).textContent = factura.cliente;
        row.insertCell(2).textContent = `$${factura.monto.toFixed(2)}`;
        row.insertCell(3).textContent = factura.fecha.toDateString();

        // Botones de acción
        const actionsCell = row.insertCell(4);
        actionsCell.innerHTML = `
            <button class="edit-btn" data-id="${factura.id}">Editar</button>
            <button class="delete-btn" data-id="${factura.id}">Eliminar</button>
        `;
    });

    // Agregar event listener para todos los botones de acción (editar, eliminar)
    tableBody.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const facturaId = btn.getAttribute('data-id');
            editarFactura(facturaId);
        });
    });

    tableBody.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const facturaId = btn.getAttribute('data-id');
            Swal.fire({
                title: '¿Está seguro?',
                text: "¡No podrás revertir esto!",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    eliminarFactura(facturaId);
                    Swal.fire(
                        'Eliminado!',
                        'La factura ha sido eliminada.',
                        'success'
                    );
                }
            });
        });
    });
}

// Funciones nuevas
function generarID() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

let facturaEditadaId = null; // Variable global para almacenar el ID de la factura en edición

function editarFactura(facturaId) {
    const facturas = obtenerFacturas();

    // Buscar la factura por ID
    const facturaEditada = facturas.find(f => f.id === facturaId);

    if (facturaEditada) {
        facturaEditadaId = facturaId; // Guardar el ID de la factura en edición

        const editForm = document.getElementById('facturaForm');
        editForm.style.display = 'block';

        const clienteInput = editForm.elements['cliente'];
        clienteInput.value = facturaEditada.cliente;

        const montoInput = editForm.elements['monto'];
        montoInput.value = facturaEditada.monto.toFixed(2);

        const fechaInput = editForm.elements['fecha'];
        fechaInput.value = new Date(facturaEditada.fecha).toISOString().split('T')[0];

        // Cambiar el texto del botón de guardar
        const saveButton = document.getElementById('saveButton');
        saveButton.textContent = 'Actualizar Factura';

        // Eliminar eventos anteriores para evitar duplicados
        saveButton.onclick = null; // Eliminar cualquier evento anterior
        saveButton.addEventListener('click', function (e) {
            e.preventDefault(); // Evitar que el formulario se envíe

            const cliente = clienteInput.value;
            const monto = parseFloat(montoInput.value);
            const fecha = new Date(fechaInput.value);

            if (!isNaN(monto) && !isNaN(fecha.getTime())) {
                // Actualizar la factura en el array y en localStorage
                const index = facturas.findIndex(f => f.id === facturaEditadaId);
                facturas[index] = { id: facturaEditadaId, cliente, monto, fecha: fecha.toISOString() };
                localStorage.setItem('facturas', JSON.stringify(facturas));

                mostrarFacturas();  // Mostrar las facturas actualizadas
                editForm.style.display = 'none';  // Ocultar el formulario de edición
                saveButton.textContent = 'Guardar Factura';  // Restablecer el texto del botón

                // Mostrar alerta de éxito
                Swal.fire({
                    icon: 'success',
                    title: 'Factura actualizada',
                    text: 'La factura ha sido actualizada correctamente.',
                });
            } else {
                // Mostrar alerta de error
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, ingrese datos válidos.',
                });
            }
        });
    }
}

function eliminarFactura(facturaId) {
    const facturas = obtenerFacturas();
    const nuevaFacturas = facturas.filter(f => f.id !== facturaId);
    localStorage.setItem('facturas', JSON.stringify(nuevaFacturas));
    mostrarFacturas();
}

// Event listener para el formulario
document.getElementById('facturaForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const cliente = this.elements['cliente'].value;
    const monto = parseFloat(this.elements['monto'].value);
    const fecha = new Date(this.elements['fecha'].value);

    if (isNaN(monto) || fecha.toString() === 'Invalid Date') {
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Por favor, ingrese datos válidos.',
        });
        return;
    }

    if (facturaEditadaId) {
        // Si hay una factura en edición, actualizarla
        const facturas = obtenerFacturas();
        const index = facturas.findIndex(f => f.id === facturaEditadaId);
        facturas[index] = { id: facturaEditadaId, cliente, monto, fecha: fecha.toISOString() };
        localStorage.setItem('facturas', JSON.stringify(facturas));
        facturaEditadaId = null; // Restablecer el ID de la factura en edición

        // Mostrar alerta de éxito
        Swal.fire({
            icon: 'success',
            title: 'Factura actualizada',
            text: 'La factura ha sido actualizada correctamente.',
        });
    } else {
        // Si no hay una factura en edición, guardar una nueva
        guardarFactura(cliente, monto, fecha);

        // Mostrar alerta de éxito
        Swal.fire({
            icon: 'success',
            title: 'Factura guardada',
            text: 'La factura ha sido guardada correctamente.',
        });
    }

    mostrarFacturas();
    this.reset(); // Reiniciar el formulario
});

// Mostrar facturas al cargar la página
window.onload = mostrarFacturas;
