// State
const state = {
    users: JSON.parse(localStorage.getItem('fit_users')) || [],
    currentUser: JSON.parse(localStorage.getItem('fit_current_user')) || null,
    workouts: JSON.parse(localStorage.getItem('fit_workouts')) || {}, // { userId: { date: boolean } }
    weights: JSON.parse(localStorage.getItem('fit_weights')) || {}, // { userId: [ { date, weight } ] }
    chat: JSON.parse(localStorage.getItem('fit_chat')) || [] // [ { sender, text, timestamp } ]
};

// DOM Elements
const app = document.getElementById('app');

// Utils
const saveState = () => {
    localStorage.setItem('fit_users', JSON.stringify(state.users));
    localStorage.setItem('fit_current_user', JSON.stringify(state.currentUser));
    localStorage.setItem('fit_workouts', JSON.stringify(state.workouts));
    localStorage.setItem('fit_weights', JSON.stringify(state.weights));
    localStorage.setItem('fit_chat', JSON.stringify(state.chat));
};

const generateId = () => Math.random().toString(36).substr(2, 9);

// Navigation
const navigateTo = (view) => {
    app.innerHTML = '';
    window.scrollTo(0, 0);

    switch (view) {
        case 'splash': renderSplash(); break;
        case 'auth': renderAuth(); break;
        case 'dashboard': renderDashboard(); break;
        case 'admin': renderAdmin(); break;
        default: renderSplash();
    }
};

// Views
const renderSplash = () => {
    app.innerHTML = `
        <div class="splash-screen">
            <i class="ph-fill ph-barbell dumbbell-icon"></i>
            <div class="brand-name">Fit Training</div>
        </div>
    `;

    setTimeout(() => {
        if (state.currentUser) {
            if (state.currentUser.role === 'admin') {
                navigateTo('admin');
            } else {
                navigateTo('dashboard');
            }
        } else {
            navigateTo('auth');
        }
    }, 3000);
};

const renderAuth = () => {
    let isRegister = false;

    const renderForm = () => {
        app.innerHTML = `
            <div class="splash-screen" style="justify-content: flex-start; padding-top: 4rem;">
                <i class="ph-fill ph-barbell dumbbell-icon" style="font-size: 3rem;"></i>
                <div class="brand-name" style="margin-bottom: 1rem; opacity: 1; animation: none;">Fit Training</div>
                
                <div class="auth-container" style="opacity: 1; animation: slideUp 0.5s ease-out;">
                    <div class="auth-toggle">
                        <span class="${!isRegister ? 'active' : ''}" id="tab-login">Entrar</span>
                        <span class="${isRegister ? 'active' : ''}" id="tab-register">Cadastrar</span>
                    </div>

                    <form id="auth-form">
                        ${isRegister ? `
                            <div class="input-group">
                                <input type="text" id="name" class="input-field" placeholder="Nome Completo" required>
                            </div>
                        ` : ''}
                        
                        <div class="input-group">
                            <label class="input-label">Email / Número</label>
                            <input type="text" id="email" class="input-field" placeholder="exemplo@email.com" required>
                        </div>

                        <div class="input-group">
                            <input type="password" id="password" class="input-field" placeholder="Senha" required>
                        </div>

                        ${isRegister ? `
                            <div class="input-group">
                                <input type="password" id="confirm-password" class="input-field" placeholder="Confirmar Senha" required>
                            </div>
                        ` : ''}

                        <button type="submit" class="btn btn-primary">
                            ${isRegister ? 'Cadastrar' : 'Entrar'}
                        </button>
                    </form>
                </div>
            </div>
        `;

        document.getElementById('tab-login').onclick = () => { isRegister = false; renderForm(); };
        document.getElementById('tab-register').onclick = () => { isRegister = true; renderForm(); };

        document.getElementById('auth-form').onsubmit = (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            if (isRegister) {
                const name = document.getElementById('name').value;
                const confirmPassword = document.getElementById('confirm-password').value;

                if (password !== confirmPassword) {
                    alert('As senhas não coincidem!');
                    return;
                }

                if (state.users.find(u => u.email === email)) {
                    alert('Usuário já existe!');
                    return;
                }

                const newUser = { id: generateId(), name, email, password, role: 'student', joined: new Date() };
                state.users.push(newUser);
                state.currentUser = newUser;
                saveState();
                navigateTo('dashboard');
            } else {
                // Admin backdoor
                if (email === 'admin' && password === 'admin') {
                    const adminUser = { id: 'admin', name: 'Treinador', email: 'admin', role: 'admin' };
                    state.currentUser = adminUser;
                    saveState();
                    navigateTo('admin');
                    return;
                }

                const user = state.users.find(u => u.email === email && u.password === password);
                if (user) {
                    state.currentUser = user;
                    saveState();
                    navigateTo('dashboard');
                } else {
                    alert('Credenciais inválidas!');
                }
            }
        };
    };

    renderForm();
};

const renderDashboard = () => {
    let activeTab = 'home'; // home, workouts, chat, progress

    const render = () => {
        const content = getContent(activeTab);

        app.innerHTML = `
            <div class="dashboard">
                <div class="header">
                    <div class="welcome-text">Olá, ${state.currentUser.name} 👋</div>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">Vamos treinar hoje?</div>
                </div>

                <div class="content-area">
                    ${content}
                </div>

                <div class="bottom-nav">
                    <div class="nav-item ${activeTab === 'home' ? 'active' : ''}" onclick="window.switchTab('home')">
                        <i class="ph ph-info"></i>
                        <span>Instruções</span>
                    </div>
                    <div class="nav-item ${activeTab === 'workouts' ? 'active' : ''}" onclick="window.switchTab('workouts')">
                        <i class="ph ph-barbell"></i>
                        <span>Treino</span>
                    </div>
                    <div class="nav-item ${activeTab === 'chat' ? 'active' : ''}" onclick="window.switchTab('chat')">
                        <i class="ph ph-chat-circle-dots"></i>
                        <span>Chat</span>
                    </div>
                    <div class="nav-item ${activeTab === 'progress' ? 'active' : ''}" onclick="window.switchTab('progress')">
                        <i class="ph ph-chart-line-up"></i>
                        <span>Medição</span>
                    </div>
                </div>
            </div>
        `;
    };

    window.switchTab = (tab) => {
        activeTab = tab;
        render();
    };

    render();
};

const getContent = (tab) => {
    switch (tab) {
        case 'home':
            return `
                <div class="card">
                    <h3>Instruções do Treinador</h3>
                    <p style="color: var(--text-secondary); margin-top: 1rem; line-height: 1.6;">
                        Bem-vindo ao Fit Training! Aqui estão suas diretrizes para esta semana:
                        <br><br>
                        1. Mantenha-se hidratado.<br>
                        2. Respeite os intervalos de descanso.<br>
                        3. Foque na execução correta dos movimentos.<br>
                        4. Registre seus treinos diariamente na aba "Treino".
                    </p>
                </div>
                <div class="card">
                    <h3>Novidades</h3>
                    <p style="color: var(--text-secondary); margin-top: 0.5rem;">
                        Novos equipamentos chegaram na academia! Venha conferir.
                    </p>
                </div>
                <button class="btn btn-secondary" onclick="logout()">Sair</button>
            `;
        case 'workouts':
            const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
            const userWorkouts = state.workouts[state.currentUser.id] || {};

            // Calculate progress
            const completedCount = Object.values(userWorkouts).filter(v => v).length;
            const progressPercent = Math.min(100, Math.round((completedCount / 7) * 100));

            let daysHtml = days.map((day, index) => {
                const dateKey = `${new Date().getFullYear()}-${new Date().getMonth()}-${index}`; // Simplified weekly logic
                const isDone = userWorkouts[dateKey];
                return `
                    <div class="student-item" onclick="toggleWorkout('${dateKey}')">
                        <span>${day}</span>
                        <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid var(--accent); background: ${isDone ? 'var(--accent)' : 'transparent'}; display: flex; align-items: center; justify-content: center;">
                            ${isDone ? '<i class="ph-bold ph-check" style="color: #000;"></i>' : ''}
                        </div>
                    </div>
                `;
            }).join('');

            return `
                <div class="card" style="text-align: center;">
                    <h3>Progresso Semanal</h3>
                    <div class="progress-container">
                        <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                        <div class="progress-text">${progressPercent}%</div>
                    </div>
                </div>
                <h3>Rotina Semanal</h3>
                <div style="margin-top: 1rem;">
                    ${daysHtml}
                </div>
            `;
        case 'chat':
            const messages = state.chat.filter(m => m.userId === state.currentUser.id || m.to === state.currentUser.id);
            return `
                <div class="chat-container" style="height: calc(100vh - 200px);">
                    <div class="chat-messages" id="chat-box">
                        ${messages.length === 0 ? '<p style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">Comece uma conversa com seu treinador!</p>' : ''}
                        ${messages.map(m => `
                            <div class="message ${m.sender === 'student' ? 'sent' : 'received'}">
                                ${m.text}
                            </div>
                        `).join('')}
                    </div>
                    <div class="chat-input-area">
                        <input type="text" id="chat-input" class="input-field" placeholder="Digite sua mensagem...">
                        <button class="btn btn-primary" style="width: auto; margin-bottom: 0;" onclick="sendMessage()">
                            <i class="ph-fill ph-paper-plane-right"></i>
                        </button>
                    </div>
                </div>
            `;
        case 'progress':
            const weights = state.weights[state.currentUser.id] || [];
            const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : '--';

            // Simple Bar Chart Visualization
            let chartHtml = '';
            if (weights.length > 0) {
                const maxWeight = Math.max(...weights.map(w => w.weight)) + 10;
                chartHtml = `
                    <div style="display: flex; align-items: flex-end; justify-content: space-between; height: 150px; margin-top: 2rem; gap: 10px;">
                        ${weights.slice(-5).map(w => `
                            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
                                <div style="width: 100%; background-color: var(--bg-dark); border-radius: 8px; overflow: hidden; height: 100%; display: flex; align-items: flex-end;">
                                    <div style="width: 100%; height: ${(w.weight / maxWeight) * 100}%; background-color: var(--accent); transition: height 0.5s;"></div>
                                </div>
                                <span style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">${new Date(w.date).getDate()}/${new Date(w.date).getMonth() + 1}</span>
                            </div>
                        `).join('')}
                    </div>
                `;
            }

            return `
                <div class="card">
                    <h3>Peso Atual</h3>
                    <div style="font-size: 3rem; font-weight: 700; color: var(--accent); margin: 1rem 0;">
                        ${latestWeight} <span style="font-size: 1rem; color: var(--text-secondary);">kg</span>
                    </div>
                    <div class="input-group" style="display: flex; gap: 0.5rem;">
                        <input type="number" id="weight-input" class="input-field" placeholder="Novo peso (kg)">
                        <button class="btn btn-primary" style="width: auto; margin-bottom: 0;" onclick="addWeight()">OK</button>
                    </div>
                </div>
                ${weights.length > 0 ? `
                    <div class="card">
                        <h3>Evolução</h3>
                        ${chartHtml}
                    </div>
                ` : ''}
            `;
    }
};

// Actions
window.toggleWorkout = (dateKey) => {
    if (!state.workouts[state.currentUser.id]) {
        state.workouts[state.currentUser.id] = {};
    }
    const current = state.workouts[state.currentUser.id][dateKey];
    state.workouts[state.currentUser.id][dateKey] = !current;
    saveState();
    window.switchTab('workouts'); // Re-render
};

window.sendMessage = () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    state.chat.push({
        userId: state.currentUser.id,
        sender: 'student',
        text: text,
        timestamp: new Date()
    });

    // Simulate trainer reply
    setTimeout(() => {
        state.chat.push({
            userId: state.currentUser.id,
            sender: 'trainer',
            text: 'Olá! Recebi sua mensagem. Como posso ajudar?',
            timestamp: new Date()
        });
        saveState();
        if (document.getElementById('chat-box')) {
            window.switchTab('chat'); // Re-render to show reply
        }
    }, 1000);

    saveState();
    input.value = '';
    window.switchTab('chat');
};

window.addWeight = () => {
    const input = document.getElementById('weight-input');
    const weight = parseFloat(input.value);
    if (!weight) return;

    if (!state.weights[state.currentUser.id]) {
        state.weights[state.currentUser.id] = [];
    }
    state.weights[state.currentUser.id].push({
        date: new Date(),
        weight: weight
    });
    saveState();
    window.switchTab('progress');
};

window.logout = () => {
    state.currentUser = null;
    saveState();
    navigateTo('auth');
};

// Admin View
const renderAdmin = () => {
    const renderList = () => {
        const students = state.users.filter(u => u.role !== 'admin');

        app.innerHTML = `
            <div class="dashboard">
                <div class="header">
                    <div class="welcome-text">Painel do Treinador</div>
                    <button class="btn btn-secondary" style="width: auto; padding: 0.5rem 1rem; margin-top: 1rem;" onclick="logout()">Sair</button>
                </div>
                <div class="content-area">
                    <h3>Alunos (${students.length})</h3>
                    <div style="margin-top: 1rem;">
                        ${students.map(s => `
                            <div class="student-item">
                                <div>
                                    <div style="font-weight: 600;">${s.name}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">${s.email}</div>
                                </div>
                                <i class="ph-bold ph-trash delete-btn" onclick="removeUser('${s.id}')"></i>
                            </div>
                        `).join('')}
                    </div>
                    <button class="btn btn-primary" style="margin-top: 2rem;" onclick="alert('Funcionalidade de adicionar aluno manualmente em breve!')">
                        <i class="ph-bold ph-plus"></i> Adicionar Aluno
                    </button>
                </div>
            </div>
        `;
    };

    window.removeUser = (id) => {
        if (confirm('Tem certeza que deseja remover este aluno?')) {
            state.users = state.users.filter(u => u.id !== id);
            saveState();
            renderList();
        }
    };

    renderList();
};

// Init
renderSplash();
