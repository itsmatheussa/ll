// Config
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
    ? 'http://localhost:3000/api' 
    : 'https://YOUR-BACKEND-URL.onrender.com/api'; // User will need to update this after deployment

// State (Simplified, mostly fetched)
const state = {
    currentUser: JSON.parse(localStorage.getItem('fit_current_user')) || null,
    data: { workouts: {}, weights: [], chat: [] }
};

// DOM Elements
const app = document.getElementById('app');

// Utils
const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        if (body) options.body = JSON.stringify(body);
        
        const res = await fetch(`${API_URL}${endpoint}`, options);
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (e) {
        console.error('API Error:', e);
        alert('Erro de conexão: ' + e.message);
        return null;
    }
};

// Navigation
const navigateTo = (view) => {
    app.innerHTML = '';
    window.scrollTo(0, 0);
    switch(view) {
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
    
    setTimeout(async () => {
        if (state.currentUser) {
            if (state.currentUser.role === 'admin') {
                navigateTo('admin');
            } else {
                // Refresh data
                await loadUserData();
                navigateTo('dashboard');
            }
        } else {
            navigateTo('auth');
        }
    }, 3000);
};

const loadUserData = async () => {
    if (!state.currentUser || state.currentUser.role === 'admin') return;
    const data = await apiCall(`/data/${state.currentUser.id}`);
    if (data) state.data = data;
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

        document.getElementById('auth-form').onsubmit = async (e) => {
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

                const user = await apiCall('/auth/register', 'POST', { name, email, password });
                if (user) {
                    state.currentUser = user;
                    localStorage.setItem('fit_current_user', JSON.stringify(user));
                    await loadUserData();
                    navigateTo('dashboard');
                }
            } else {
                const user = await apiCall('/auth/login', 'POST', { email, password });
                if (user) {
                    state.currentUser = user;
                    localStorage.setItem('fit_current_user', JSON.stringify(user));
                    if (user.role === 'admin') {
                        navigateTo('admin');
                    } else {
                        await loadUserData();
                        navigateTo('dashboard');
                    }
                }
            }
        };
    };

    renderForm();
};

const renderDashboard = () => {
    let activeTab = 'home';

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
    switch(tab) {
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
            const userWorkouts = state.data.workouts || {};
            
            const completedCount = Object.values(userWorkouts).filter(v => v).length;
            const progressPercent = Math.min(100, Math.round((completedCount / 7) * 100));

            let daysHtml = days.map((day, index) => {
                const dateKey = `${new Date().getFullYear()}-${new Date().getMonth()}-${index}`;
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
            const messages = state.data.chat || [];
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
            const weights = state.data.weights || [];
            const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : '--';
            
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
                                <span style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem;">${new Date(w.date).getDate()}/${new Date(w.date).getMonth()+1}</span>
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
window.toggleWorkout = async (dateKey) => {
    const current = state.data.workouts[dateKey];
    const newStatus = !current;
    
    // Optimistic update
    state.data.workouts[dateKey] = newStatus;
    window.switchTab('workouts');

    await apiCall('/workouts', 'POST', { userId: state.currentUser.id, dateKey, status: newStatus });
};

window.sendMessage = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    // Optimistic update
    state.data.chat.push({
        userId: state.currentUser.id,
        sender: 'student',
        text: text,
        timestamp: new Date()
    });
    window.switchTab('chat');
    input.value = '';

    await apiCall('/chat', 'POST', { userId: state.currentUser.id, sender: 'student', text });
    
    // Reload to get reply
    setTimeout(async () => {
        await loadUserData();
        if (document.getElementById('chat-box')) window.switchTab('chat');
    }, 1500);
};

window.addWeight = async () => {
    const input = document.getElementById('weight-input');
    const weight = parseFloat(input.value);
    if (!weight) return;

    await apiCall('/weights', 'POST', { userId: state.currentUser.id, weight });
    await loadUserData();
    window.switchTab('progress');
};

window.logout = () => {
    state.currentUser = null;
    localStorage.removeItem('fit_current_user');
    navigateTo('auth');
};

// Admin View
const renderAdmin = async () => {
    const students = await apiCall('/users');
    
    const renderList = () => {
        app.innerHTML = `
            <div class="dashboard">
                <div class="header">
                    <div class="welcome-text">Painel do Treinador</div>
                    <button class="btn btn-secondary" style="width: auto; padding: 0.5rem 1rem; margin-top: 1rem;" onclick="logout()">Sair</button>
                </div>
                <div class="content-area">
                    <h3>Alunos (${students ? students.length : 0})</h3>
                    <div style="margin-top: 1rem;">
                        ${students && students.map(s => `
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

    window.removeUser = async (id) => {
        if (confirm('Tem certeza que deseja remover este aluno?')) {
            await apiCall(`/users/${id}`, 'DELETE');
            renderAdmin(); // Reload
        }
    };

    renderList();
};

// Init
renderSplash();
