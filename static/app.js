// Config
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://ll-r9ur.onrender.com/api';

// State
const state = {
    currentUser: JSON.parse(localStorage.getItem('fit_current_user')) || null,
    data: { workouts: {}, weights: [], chat: [] },
    users: [] // For admin
};

// DOM
const app = document.getElementById('app');

// Utils
const apiCall = async (endpoint, method = 'GET', body = null) => {
    try {
        const options = { method, headers: { 'Content-Type': 'application/json' } };
        if (body) options.body = JSON.stringify(body);
        const res = await fetch(`${API_URL}${endpoint}`, options);
        if (!res.ok) throw new Error(await res.text());
        return await res.json();
    } catch (e) {
        console.error(e);
        return null;
    }
};

const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

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
            <h1 style="margin-top: 1rem; font-weight: 800; letter-spacing: -1px;">FIT TRAINING</h1>
            <p style="color: var(--text-muted);">Sua evolução começa agora.</p>
        </div>
    `;
    setTimeout(async () => {
        if (state.currentUser) {
            if (state.currentUser.role === 'admin') navigateTo('admin');
            else { await loadUserData(); navigateTo('dashboard'); }
        } else navigateTo('auth');
    }, 2500);
};

const loadUserData = async () => {
    if (!state.currentUser || state.currentUser.role === 'admin') return;
    const data = await apiCall(`/data/${state.currentUser.id}`);
    if (data) state.data = data;
};

const renderAuth = () => {
    let isRegister = false;
    const render = () => {
        app.innerHTML = `
            <div class="splash-screen" style="justify-content: flex-end; padding-bottom: 3rem;">
                <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%;">
                    <i class="ph-fill ph-barbell dumbbell-icon" style="font-size: 4rem; margin-bottom: 2rem;"></i>
                    <div class="card" style="width: 100%; padding: 2rem;">
                        <h2 style="margin-bottom: 1.5rem; text-align: center;">${isRegister ? 'Criar Conta' : 'Bem-vindo'}</h2>
                        
                        <div class="tabs" style="justify-content: center; margin-bottom: 2rem;">
                            <div class="tab-chip ${!isRegister ? 'active' : ''}" onclick="window.toggleAuth(false)">Entrar</div>
                            <div class="tab-chip ${isRegister ? 'active' : ''}" onclick="window.toggleAuth(true)">Cadastrar</div>
                        </div>

                        <form id="auth-form">
                            ${isRegister ? `<div class="input-group"><input type="text" id="name" class="input-field" placeholder="Nome Completo" required></div>` : ''}
                            <div class="input-group"><input type="text" id="email" class="input-field" placeholder="Email ou Telefone" required></div>
                            <div class="input-group"><input type="password" id="password" class="input-field" placeholder="Senha" required></div>
                            ${isRegister ? `<div class="input-group"><input type="password" id="confirm-password" class="input-field" placeholder="Confirmar Senha" required></div>` : ''}
                            
                            <button type="submit" class="btn btn-primary">
                                ${isRegister ? 'Começar Agora' : 'Acessar App'} <i class="ph-bold ph-arrow-right"></i>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('auth-form').onsubmit = handleAuth;
    };

    window.toggleAuth = (val) => { isRegister = val; render(); };

    const handleAuth = async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (isRegister) {
            const name = document.getElementById('name').value;
            const confirm = document.getElementById('confirm-password').value;
            if (password !== confirm) return alert('Senhas não conferem');

            const user = await apiCall('/auth/register', 'POST', { name, email, password });
            if (user) loginUser(user);
        } else {
            const user = await apiCall('/auth/login', 'POST', { email, password });
            if (user) loginUser(user);
            else alert('Dados incorretos');
        }
    };

    const loginUser = async (user) => {
        state.currentUser = user;
        localStorage.setItem('fit_current_user', JSON.stringify(user));
        if (user.role === 'admin') navigateTo('admin');
        else { await loadUserData(); navigateTo('dashboard'); }
    };

    render();
};

const renderDashboard = () => {
    let activeTab = 'home';

    const render = () => {
        const content = getContent(activeTab);
        app.innerHTML = `
            <div class="dashboard">
                <div class="header">
                    <div>
                        <h2 style="font-weight: 800;">Olá, ${state.currentUser.name.split(' ')[0]}</h2>
                        <p style="color: var(--text-muted); font-size: 0.9rem;">Vamos superar seus limites hoje.</p>
                    </div>
                    <div class="user-avatar">${state.currentUser.name.charAt(0)}</div>
                </div>

                <div class="content-area">
                    ${content}
                </div>

                <div class="bottom-nav">
                    <div class="nav-item ${activeTab === 'home' ? 'active' : ''}" onclick="window.switchTab('home')">
                        <i class="ph-fill ph-house"></i><span>Início</span>
                    </div>
                    <div class="nav-item ${activeTab === 'workouts' ? 'active' : ''}" onclick="window.switchTab('workouts')">
                        <i class="ph-fill ph-barbell"></i><span>Treino</span>
                    </div>
                    <div class="nav-item ${activeTab === 'chat' ? 'active' : ''}" onclick="window.switchTab('chat')">
                        <i class="ph-fill ph-chat-circle-text"></i><span>Chat</span>
                    </div>
                    <div class="nav-item ${activeTab === 'progress' ? 'active' : ''}" onclick="window.switchTab('progress')">
                        <i class="ph-fill ph-chart-line-up"></i><span>Evolução</span>
                    </div>
                </div>
            </div>
        `;
    };

    window.switchTab = (tab) => { activeTab = tab; render(); };
    render();
};

const getContent = (tab) => {
    switch (tab) {
        case 'home':
            const completed = Object.values(state.data.workouts || {}).filter(v => v).length;
            const percent = Math.min(100, Math.round((completed / 7) * 100));
            const liquidTop = 100 - percent; // 100% = top 0%, 0% = top 100%

            return `
                <div class="card" style="text-align: center; padding: 2rem 1rem;">
                    <h3 style="margin-bottom: 1rem; color: var(--text-muted);">Progresso Semanal</h3>
                    <div class="liquid-container">
                        <div class="liquid-inner">
                            <div class="liquid-wave" style="top: ${liquidTop}%"></div>
                            <div class="liquid-wave" style="top: ${liquidTop}%"></div>
                        </div>
                        <div class="liquid-text">${percent}%</div>
                    </div>
                    <p style="font-size: 0.9rem; color: var(--text-muted);">Continue focado!</p>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                    <div class="card" onclick="window.switchTab('workouts')">
                        <i class="ph-duotone ph-check-circle" style="font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem;"></i>
                        <h3>Treinos</h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">${completed}/7 Concluídos</p>
                    </div>
                    <div class="card" onclick="window.switchTab('progress')">
                        <i class="ph-duotone ph-scales" style="font-size: 2rem; color: var(--secondary); margin-bottom: 0.5rem;"></i>
                        <h3>Peso</h3>
                        <p style="font-size: 0.8rem; color: var(--text-muted);">Registrar hoje</p>
                    </div>
                </div>

                <div class="card">
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="background: rgba(163, 230, 53, 0.1); padding: 0.8rem; border-radius: 12px;">
                            <i class="ph-fill ph-megaphone" style="color: var(--primary); font-size: 1.5rem;"></i>
                        </div>
                        <div>
                            <h3>Mural do Treinador</h3>
                            <p style="font-size: 0.8rem; color: var(--text-muted);">Atualizado hoje</p>
                        </div>
                    </div>
                    <p style="line-height: 1.6; color: var(--text-main);">
                        "A persistência realiza o impossível."<br>
                        Lembre-se de beber 3L de água hoje!
                    </p>
                </div>
                
                <button class="btn btn-secondary" onclick="logout()" style="margin-top: 2rem;">
                    <i class="ph-bold ph-sign-out"></i> Sair da Conta
                </button>
            `;

        case 'workouts':
            const days = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
            return `
                <h2 style="margin-bottom: 1.5rem;">Sua Rotina</h2>
                <div style="display: flex; flex-direction: column; gap: 0.8rem;">
                    ${days.map((day, i) => {
                const key = `${new Date().getFullYear()}-${new Date().getMonth()}-${i}`;
                const done = state.data.workouts[key];
                return `
                            <div class="card" style="margin: 0; display: flex; align-items: center; justify-content: space-between; padding: 1.2rem;" onclick="toggleWorkout('${key}')">
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <div style="background: ${done ? 'var(--primary)' : 'rgba(255,255,255,0.05)'}; width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                                        <span style="font-weight: 700; color: ${done ? '#000' : '#fff'}">${day}</span>
                                    </div>
                                    <div>
                                        <h3 style="margin-bottom: 0.2rem;">Treino ${String.fromCharCode(65 + i)}</h3>
                                        <p style="font-size: 0.8rem; color: var(--text-muted);">${done ? 'Concluído' : 'Pendente'}</p>
                                    </div>
                                </div>
                                <div style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid ${done ? 'var(--primary)' : 'var(--border)'}; background: ${done ? 'var(--primary)' : 'transparent'}; display: flex; align-items: center; justify-content: center;">
                                    ${done ? '<i class="ph-bold ph-check" style="color: #000; font-size: 0.8rem;"></i>' : ''}
                                </div>
                            </div>
                        `;
            }).join('')}
                </div>
            `;

        case 'chat':
            return `
                <div style="height: calc(100vh - 180px); display: flex; flex-direction: column;">
                    <div class="card" style="margin-bottom: 1rem; padding: 1rem; display: flex; align-items: center; gap: 1rem;">
                        <div class="user-avatar" style="background: var(--primary); color: #000;">T</div>
                        <div>
                            <h3>Seu Treinador</h3>
                            <p style="font-size: 0.8rem; color: var(--primary);">Online agora</p>
                        </div>
                    </div>
                    
                    <div id="chat-box" style="flex: 1; overflow-y: auto; padding: 0.5rem;">
                        ${state.data.chat.length === 0 ? '<p style="text-align: center; color: var(--text-muted); margin-top: 2rem;">Tire suas dúvidas aqui!</p>' : ''}
                        ${state.data.chat.map(m => `
                            <div class="chat-bubble ${m.sender === 'student' ? 'sent' : 'received'}">
                                ${m.text}
                                <div style="font-size: 0.6rem; opacity: 0.7; margin-top: 4px; text-align: right;">${new Date(m.timestamp).getHours()}:${String(new Date(m.timestamp).getMinutes()).padStart(2, '0')}</div>
                            </div>
                        `).join('')}
                    </div>

                    <div style="display: flex; gap: 0.8rem; margin-top: 1rem;">
                        <input type="text" id="chat-input" class="input-field" placeholder="Digite sua mensagem..." style="border-radius: 24px;">
                        <button class="btn btn-primary" style="width: 50px; height: 50px; border-radius: 50%; padding: 0;" onclick="sendMessage()">
                            <i class="ph-fill ph-paper-plane-right" style="font-size: 1.2rem;"></i>
                        </button>
                    </div>
                </div>
            `;

        case 'progress':
            const weights = state.data.weights || [];
            const currentWeight = weights.length ? weights[weights.length - 1].weight : 0;

            return `
                <div class="card">
                    <h3 style="color: var(--text-muted);">Peso Atual</h3>
                    <div style="font-size: 3.5rem; font-weight: 800; color: var(--text-main); margin: 1rem 0;">
                        ${currentWeight} <span style="font-size: 1.5rem; color: var(--primary);">kg</span>
                    </div>
                    <div style="display: flex; gap: 0.5rem;">
                        <input type="number" id="weight-input" class="input-field" placeholder="Novo peso">
                        <button class="btn btn-primary" style="width: auto;" onclick="addWeight()">
                            <i class="ph-bold ph-plus"></i>
                        </button>
                    </div>
                </div>

                <h3 style="margin: 1.5rem 0 1rem;">Histórico</h3>
                <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                    ${weights.slice().reverse().map(w => `
                        <div class="card" style="margin: 0; padding: 1rem; display: flex; justify-content: space-between; align-items: center;">
                            <span style="font-weight: 600; font-size: 1.1rem;">${w.weight} kg</span>
                            <span style="color: var(--text-muted); font-size: 0.9rem;">${formatDate(w.date)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
    }
};

// Admin View
const renderAdmin = async () => {
    let activeTab = 'students'; // students, trainers
    const users = await apiCall('/users');
    state.users = users || [];

    const render = () => {
        const students = state.users.filter(u => u.role === 'student');
        const trainers = state.users.filter(u => u.role === 'admin' || u.role === 'trainer');

        app.innerHTML = `
            <div class="dashboard">
                <div class="header">
                    <div>
                        <h2 style="font-weight: 800;">Painel Admin</h2>
                        <p style="color: var(--text-muted);">Gerencie sua academia</p>
                    </div>
                    <button class="btn btn-secondary" style="width: auto; padding: 0.5rem;" onclick="logout()">
                        <i class="ph-bold ph-sign-out"></i>
                    </button>
                </div>

                <div class="content-area">
                    <div class="tabs">
                        <div class="tab-chip ${activeTab === 'students' ? 'active' : ''}" onclick="window.switchAdminTab('students')">Alunos (${students.length})</div>
                        <div class="tab-chip ${activeTab === 'trainers' ? 'active' : ''}" onclick="window.switchAdminTab('trainers')">Treinadores (${trainers.length})</div>
                    </div>

                    ${activeTab === 'students' ? `
                        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
                            ${students.map(s => `
                                <div class="student-card">
                                    <div class="user-avatar" style="width: 40px; height: 40px; font-size: 0.9rem;">${s.name.charAt(0)}</div>
                                    <div class="student-info">
                                        <div style="font-weight: 600;">${s.name}</div>
                                        <div style="font-size: 0.8rem; color: var(--text-muted);">${s.email}</div>
                                    </div>
                                    <button class="btn btn-secondary" style="width: auto; padding: 0.5rem; border-radius: 10px; color: #ef4444; border-color: rgba(239,68,68,0.2);" onclick="removeUser('${s.id}')">
                                        <i class="ph-fill ph-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button class="btn btn-primary" style="margin-top: 1.5rem;" onclick="alert('Use o app como aluno para se cadastrar!')">
                            <i class="ph-bold ph-plus"></i> Novo Aluno
                        </button>
                    ` : `
                        <div class="card" style="border-color: var(--primary); background: rgba(163, 230, 53, 0.05);">
                            <h3>Adicionar Treinador</h3>
                            <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1rem;">Crie acesso para novos profissionais.</p>
                            <div class="input-group"><input type="text" id="t-name" class="input-field" placeholder="Nome"></div>
                            <div class="input-group"><input type="email" id="t-email" class="input-field" placeholder="Email"></div>
                            <div class="input-group"><input type="password" id="t-pass" class="input-field" placeholder="Senha"></div>
                            <button class="btn btn-primary" onclick="addTrainer()">Cadastrar Treinador</button>
                        </div>

                        <h3 style="margin: 1.5rem 0 1rem;">Equipe</h3>
                        ${trainers.map(t => `
                            <div class="student-card">
                                <div class="user-avatar" style="background: var(--secondary); color: #fff;">${t.name.charAt(0)}</div>
                                <div class="student-info">
                                    <div style="font-weight: 600;">${t.name}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-muted);">Treinador</div>
                                </div>
                            </div>
                        `).join('')}
                    `}
                </div>
            </div>
        `;
    };

    window.switchAdminTab = (tab) => { activeTab = tab; render(); };
    window.addTrainer = async () => {
        const name = document.getElementById('t-name').value;
        const email = document.getElementById('t-email').value;
        const password = document.getElementById('t-pass').value;
        if (!name || !email || !password) return alert('Preencha tudo');

        // Mock API call since backend doesn't support 'role' param in register yet, 
        // but in a real app we would send role: 'trainer'
        // For now, we will just alert.
        alert('Funcionalidade simulada: Treinador ' + name + ' cadastrado!');
        // To make it real, backend needs to accept 'role' in /api/auth/register
    };

    render();
};

// Global Actions
window.toggleWorkout = async (key) => {
    const val = !state.data.workouts[key];
    state.data.workouts[key] = val;
    window.switchTab('workouts');
    await apiCall('/workouts', 'POST', { userId: state.currentUser.id, dateKey: key, status: val });
};

window.sendMessage = async () => {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    state.data.chat.push({ userId: state.currentUser.id, sender: 'student', text, timestamp: new Date() });
    window.switchTab('chat');
    input.value = '';

    await apiCall('/chat', 'POST', { userId: state.currentUser.id, sender: 'student', text });
    setTimeout(async () => { await loadUserData(); if (document.getElementById('chat-box')) window.switchTab('chat'); }, 1500);
};

window.addWeight = async () => {
    const val = parseFloat(document.getElementById('weight-input').value);
    if (!val) return;
    await apiCall('/weights', 'POST', { userId: state.currentUser.id, weight: val });
    await loadUserData();
    window.switchTab('progress');
};

window.removeUser = async (id) => {
    if (confirm('Remover usuário?')) {
        await apiCall(`/users/${id}`, 'DELETE');
        renderAdmin();
    }
};

window.logout = () => {
    localStorage.removeItem('fit_current_user');
    state.currentUser = null;
    navigateTo('auth');
};

// Init
renderSplash();
