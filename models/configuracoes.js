// Verifica o estado de autenticação do usuário
firebase.auth().onAuthStateChanged(async (user) => {
    if (user) {
        const userEmail = user.email;
        let userName = user.displayName;

        // Se o nome não estiver disponível (usuário de email/password), tente buscar do Firestore
        if (!userName) {
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                userName = userDoc.data().name || '';
            }
        }

        // Preenche os inputs com os dados do usuário
        document.getElementById('description').value = userName ? userName : '';
        document.getElementById('email').value = userEmail;

        // Verifica se o usuário está autenticado via Google
        const isGoogleAuth = user.providerData.some((provider) => provider.providerId === 'google.com');
        if (isGoogleAuth) {
            // Esconde o campo de senha atual e troca de senha para usuários do Google
            document.getElementById('current-password-section').style.display = 'none'; // Esconde o campo de senha atual
            document.getElementById('password-section').style.display = 'block'; // Mostra o campo de nova senha
            document.getElementById('reset-password-btn').style.display = 'block'; // Mostra o botão de redefinição de senha por email
        } else {
            // Usuário que não é do Google: mostra o campo de senha atual e esconde o botão de redefinição por email
            document.getElementById('current-password-section').style.display = 'block'; // Mostra o campo de senha atual
            document.getElementById('password-section').style.display = 'block'; // Mostra o campo de nova senha
            document.getElementById('reset-password-btn').style.display = 'none'; // Esconde o botão de redefinição de senha por email
        }
    } else {
        alert("Nenhum usuário logado.");
    }
});

// Função para salvar o nome do usuário no Firestore
async function saveUserName(event) {
    event.preventDefault();
    const user = firebase.auth().currentUser;
    const userName = document.getElementById('description').value;

    if (user && userName) {
        try {
            // Salva o nome no Firestore
            await firebase.firestore().collection('users').doc(user.uid).set({
                name: userName,
            }, { merge: true });

            alert("Nome salvo com sucesso.");

            // Atualiza o input com o nome alterado imediatamente
            document.getElementById('description').value = userName;
            
        } catch (error) {
            alert("Erro ao salvar o nome: " + error.message);
        }
    } else {
        alert("Por favor, insira um nome.");
    }
}

// Função para alterar a senha (usuários que não são do Google)
function changePassword() {
    const newPassword = document.getElementById('password').value;

    if (newPassword) {
        const user = firebase.auth().currentUser;
        user.updatePassword(newPassword).then(() => {
            alert("Senha alterada com sucesso.");
        }).catch((error) => {
            alert("Erro ao alterar a senha: " + error.message);
        });
    } else {
        alert("Por favor, insira uma nova senha.");
    }
}

// Envia um email de redefinição de senha (usuários Google)
function sendPasswordResetEmail() {
    const user = firebase.auth().currentUser;

    if (user && user.providerData.some((provider) => provider.providerId === 'google.com')) {
        firebase.auth().sendPasswordResetEmail(user.email)
            .then(() => {
                alert("Email de redefinição de senha enviado para " + user.email);
            })
            .catch((error) => {
                alert("Erro ao enviar o email de redefinição: " + error.message);
            });
    } else {
        alert("Este usuário não está autenticado com o Google.");
    }
}