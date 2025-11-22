document.addEventListener('DOMContentLoaded', () => {

    /**
     * Resalta el enlace de navegación activo.
     */
    const setActiveNavLink = () => {
        const currentPage = window.location.pathname;
        const navLinks = document.querySelectorAll('.main-nav a');
        navLinks.forEach(link => {
            const linkHref = link.getAttribute('href');
            if (linkHref === '/' && currentPage === '/') {
                link.classList.add('active');
            } else if (linkHref !== '/' && currentPage.startsWith(linkHref)) {
                link.classList.add('active');
            }
        });
    };

    /**
     * Inicializa la lógica para los modales de Login y Registro.
     */
    const initializeModalLogic = () => {
        const loginModal = document.getElementById('login-modal');
        const signupModal = document.getElementById('signup-modal');
        const loginBtn = document.getElementById('login-btn');
        const signupBtn = document.getElementById('signup-btn');
        if (!loginBtn || !signupBtn) return;
        const loginModalContent = `
            <div class="modal-content">
                <span class="modal-close">&times;</span><h2>Log In to Your Account</h2>
                <form id="login-form">
                    <div class="form-group"><label for="login-email">Correo</label><input type="email" id="login-email" name="email" required></div>
                    <div class="form-group"><label for="login-password">Contraseña</label><input type="password" id="login-password" name="password" required></div>
                    <button type="submit" class="btn btn-primary full-width">Log In</button>
                    <p id="modal-message" style="margin-top: 15px;"></p>
                    <p class="link">No tienes cuenta? <a href="#" id="show-signup">Sign up</a></p>
                </form>
            </div>`;
        const signupModalContent = `
            <div class="modal-content">
                <span class="modal-close">&times;</span><h2>Create Your Account</h2>
                <form id="signup-form">
                     <div class="form-group"><label for="signup-first-name">Nombre</label><input type="text" id="signup-first-name" name="nombre" required></div>
                     <div class="form-group"><label for="signup-last-name">Apellido</label><input type="text" id="signup-last-name" name="apellido" required></div>
                     <div class="form-group"><label for="signup-email">Correo</label><input type="email" id="signup-email" name="email" required></div>
                     <div class="form-group"><label for="signup-phone">Numero Telefonico</label><input type="tel" id="signup-phone" name="telefono"></div>
                     <div class="form-group"><label for="signup-dob">Fecha de Nacimiento</label><input type="text" id="signup-dob" name="fechaNacimiento"></div>
                     <div class="form-group"><label for="signup-password">Contraseña</label><input type="password" id="signup-password" name="password" required></div>
                    <button type="submit" class="btn btn-primary full-width">Crear Cuenta</button>
                    <p id="modal-message" style="margin-top: 15px;"></p>
                    <p class="link">Ya tienes cuenta? <a href="#" id="show-login">Log in</a></p>
                </form>
            </div>`;
        const handleLoginSubmit = async (event) => {
            event.preventDefault();
            const form = event.target;
            const messageEl = document.getElementById('modal-message');
            messageEl.textContent = 'Iniciando sesión...';
            messageEl.style.color = '#333';
            try {
                const formData = new FormData(form);
                const datos = Object.fromEntries(formData.entries());
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                messageEl.textContent = result.mensaje;
                messageEl.style.color = 'green';
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                messageEl.textContent = error.message;
                messageEl.style.color = 'red';
            }
        };
        const handleSignupSubmit = async (event) => {
            event.preventDefault(); 
            const form = event.target;
            const messageEl = document.getElementById('modal-message');
            messageEl.textContent = 'Registrando...';
            messageEl.style.color = '#333';
            try {
                const formData = new FormData(form);
                const datos = Object.fromEntries(formData.entries());
                const response = await fetch('/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                messageEl.textContent = result.mensaje;
                messageEl.style.color = 'green';
                form.reset(); 
                setTimeout(() => {
                    closeModal(signupModal);
                    openModal(loginModal, loginModalContent);
                }, 2000);
            } catch (error) {
                messageEl.textContent = error.message;
                messageEl.style.color = 'red';
            }
        };
        function openModal(modal, content) {
            modal.innerHTML = content;
            modal.style.display = 'flex';
            modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
            if (modal === loginModal) {
                modal.querySelector('#show-signup').addEventListener('click', (e) => {
                    e.preventDefault();
                    closeModal(loginModal);
                    openModal(signupModal, signupModalContent);
                });
                modal.querySelector('#login-form').addEventListener('submit', handleLoginSubmit);
            } else {
                modal.querySelector('#show-login').addEventListener('click', (e) => {
                    e.preventDefault();
                    closeModal(signupModal);
                    openModal(loginModal, loginModalContent);
                });
                modal.querySelector('#signup-form').addEventListener('submit', handleSignupSubmit);
            }
        }
        function closeModal(modal) {
            modal.style.display = 'none';
            modal.innerHTML = '';
        }
        loginBtn.addEventListener('click', () => openModal(loginModal, loginModalContent));
        signupBtn.addEventListener('click', () => openModal(signupModal, signupModalContent));
        window.addEventListener('click', (e) => {
            if (e.target === loginModal) closeModal(loginModal);
            if (e.target === signupModal) closeModal(signupModal);
        });
    };

    /**
     * Inicializa la lógica de la página de Citas (Crear y Borrar).
     */
    const initializeDatesPageLogic = () => {
        const citaForm = document.getElementById('cita-form');
        const citasLista = document.getElementById('citas-lista');
        if (!citaForm) return;
        const messageEl = document.getElementById('cita-message');
        citaForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageEl.textContent = 'Agendando cita...';
            messageEl.style.color = '#333';
            try {
                const formData = new FormData(citaForm);
                const datos = Object.fromEntries(formData.entries());
                const response = await fetch('/citas', { 
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                messageEl.textContent = result.mensaje;
                messageEl.style.color = 'green';
                citaForm.reset();
                setTimeout(() => window.location.reload(), 1500);
            } catch (error) {
                messageEl.textContent = error.message;
                messageEl.style.color = 'red';
            }
        });
        if (citasLista) {
            citasLista.addEventListener('click', async (event) => {
                if (event.target.classList.contains('cancel-btn')) {
                    event.preventDefault();
                    const citaId = event.target.dataset.id;
                    if (!confirm('¿Estás seguro de que quieres cancelar esta cita?')) {
                        return;
                    }
                    try {
                        const response = await fetch(`/citas/${citaId}`, { method: 'DELETE' });
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.error);
                        const citaElemento = document.querySelector(`li[data-id="${citaId}"]`);
                        if (citaElemento) citaElemento.remove();
                    } catch (error) {
                        console.error('Error al cancelar cita:', error);
                        alert(error.message);
                    }
                }
            });
        }
        const monthYearEl = document.getElementById('month-year');
        const calendarGrid = document.getElementById('calendar-grid');
        const prevBtn = document.getElementById('prev-month');
        const nextBtn = document.getElementById('next-month');
        if (!monthYearEl || !calendarGrid || !prevBtn || !nextBtn) return;
        let currentDate = new Date(2025, 9, 1);
        const renderCalendar = () => {
            calendarGrid.innerHTML = '';
            const month = currentDate.getMonth();
            const year = currentDate.getFullYear();
            monthYearEl.textContent = currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            dayNames.forEach(day => {
                const dayNameEl = document.createElement('div');
                dayNameEl.className = 'day-name';
                dayNameEl.textContent = day;
                calendarGrid.appendChild(dayNameEl);
            });
            for (let i = 1; i <= daysInMonth; i++) {
                const dayEl = document.createElement('div');
                dayEl.className = 'day';
                dayEl.textContent = i;
                if (i === 18 && month === 9 && year === 2025) dayEl.classList.add('today');
                calendarGrid.appendChild(dayEl);
            }
        };
        prevBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
        nextBtn.addEventListener('click', () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
        renderCalendar();
    };

    /**
     * Inicializa la lógica del formulario de Perfil en el Dashboard.
     */
     const initializeProfilePageLogic = () => {
         const profileForm = document.getElementById('profile-form');
         if (!profileForm) return;
         const messageEl = document.getElementById('profile-message');
         profileForm.addEventListener('submit', async (event) => {
             event.preventDefault();
             messageEl.textContent = 'Actualizando perfil...';
             messageEl.style.color = '#333';
             try {
                 const formData = new FormData(profileForm);
                 const response = await fetch('/perfil', {
                     method: 'POST',
                     body: formData
                 });
                 const result = await response.json();
                 if (!response.ok) throw new Error(result.error);
                 messageEl.textContent = result.mensaje;
                 messageEl.style.color = 'green';
                 setTimeout(() => window.location.reload(), 1500);
             } catch (error) {
                 messageEl.textContent = error.message;
                 messageEl.style.color = 'red';
             }
         });
         // Delete photo button
         const deletePhotoBtn = document.getElementById('delete-photo-btn');
         if (deletePhotoBtn) {
             deletePhotoBtn.addEventListener('click', async (e) => {
                 e.preventDefault();
                 if (!confirm('¿Eliminar foto de perfil?')) return;
                 try {
                     const response = await fetch('/perfil/foto', { method: 'DELETE' });
                     const result = await response.json();
                     if (!response.ok) throw new Error(result.error);
                     window.location.reload();
                 } catch (err) {
                     alert(err.message || 'Error al eliminar la foto');
                 }
             });
         }
     };    /**
     * Inicializa la lógica de la página de Gestión de Doctores (CRUD).
     */
    const initializeManageDoctorsLogic = () => {
        const doctorForm = document.getElementById('doctor-form');
        const doctorTableBody = document.getElementById('doctor-list-tbody');
        if (!doctorForm || !doctorTableBody) return;
        const formTitle = document.getElementById('form-titulo');
        const submitBtn = document.getElementById('form-submit-btn');
        const cancelBtn = document.getElementById('form-cancel-btn');
        const messageEl = document.getElementById('doctor-message');
        const resetForm = () => {
            doctorForm.reset();
            formTitle.textContent = 'Añadir Nuevo Doctor';
            submitBtn.textContent = 'Guardar Doctor';
            doctorForm.dataset.mode = 'crear';
            doctorForm.dataset.id = '';
            cancelBtn.style.display = 'none';
        };
        doctorForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            messageEl.textContent = 'Guardando...';
            const formData = new FormData(doctorForm);
            const datos = Object.fromEntries(formData.entries());
            const mode = doctorForm.dataset.mode;
            const id = doctorForm.dataset.id;
            let url = '/doctores';
            if (mode === 'editar') {
                url = `/doctores/actualizar/${id}`;
            }
            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(datos)
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.error);
                messageEl.textContent = result.mensaje;
                messageEl.style.color = 'green';
                setTimeout(() => window.location.reload(), 1000);
            } catch (error) {
                messageEl.textContent = error.message;
                messageEl.style.color = 'red';
            }
        });
        doctorTableBody.addEventListener('click', async (event) => {
            const target = event.target;
            if (target.classList.contains('delete')) {
                const id = target.dataset.id;
                if (!confirm('¿Estás seguro de que quieres eliminar a este doctor?')) return;
                try {
                    const response = await fetch(`/doctores/${id}`, { method: 'DELETE' });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    document.querySelector(`tr[data-id="${id}"]`).remove();
                } catch (error) {
                    alert(error.message);
                }
            }
            if (target.classList.contains('edit')) {
                const id = target.dataset.id;
                const fila = document.querySelector(`tr[data-id="${id}"]`);
                doctorForm.querySelector('#doc-nombre').value = fila.querySelector('td[data-field="nombreCompleto"]').textContent;
                doctorForm.querySelector('#doc-especialidad').value = fila.querySelector('td[data-field="especialidad"]').textContent;
                doctorForm.querySelector('#doc-consultorio').value = fila.querySelector('td[data-field="consultorio"]').textContent;
                doctorForm.querySelector('#doc-email').value = fila.querySelector('td[data-field="email"]').textContent;
                formTitle.textContent = 'Editar Doctor';
                submitBtn.textContent = 'Actualizar Doctor';
                doctorForm.dataset.mode = 'editar';
                doctorForm.dataset.id = id;
                cancelBtn.style.display = 'inline-block';
                doctorForm.scrollIntoView({ behavior: 'smooth' });
            }
        });
        cancelBtn.addEventListener('click', () => {
            resetForm();
        });
    };

    // --- LÓGICA DE LA PÁGINA DE ADMIN (NUEVA) ---
    const initializeAdminPageLogic = () => {
        const adminCitasTable = document.getElementById('admin-citas-tbody');

        // Si no estamos en la página de admin, no hacer nada
        if (!adminCitasTable) {
            return;
        }

        adminCitasTable.addEventListener('click', async (event) => {
            // Verificamos si el clic fue en un botón de borrar
            if (event.target.classList.contains('delete')) {
                const target = event.target;
                const citaId = target.dataset.id;

                if (!confirm('¿Estás seguro de que quieres eliminar esta cita? (Esta acción es de administrador)')) {
                    return;
                }

                try {
                    // Usamos la nueva ruta de admin para borrar
                    const response = await fetch(`/admin/citas/${citaId}`, {
                        method: 'DELETE'
                    });

                    const result = await response.json();
                    if (!response.ok) throw new Error(result.error);
                    
                    // Borramos la fila de la tabla
                    document.querySelector(`tr[data-id="${citaId}"]`).remove();

                } catch (error) {
                    console.error('Error al borrar cita (admin):', error);
                    alert(error.message);
                }
            }
        });
    };

    // --- LLAMADAS A TODAS LAS FUNCIONES ---
    setActiveNavLink();
    initializeModalLogic(); 
    initializeDatesPageLogic();
    initializeProfilePageLogic();
    initializeManageDoctorsLogic();
    initializeAdminPageLogic(); // <-- AÑADIDO
});