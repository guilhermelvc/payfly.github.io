// Inicializa as variáveis necessárias
const db = firebase.firestore();
let totalPlano = 0;

// Função para manipular o modal de adicionar e filtro
const Modal = {
    open() {
        document.querySelector('.modal-overlay').classList.add('active');
    },
    close() {
        document.querySelector('.modal-overlay').classList.remove('active');
    },
};

// Função para formatar a data
function formatarData(date) {
    return new Date(date).toLocaleDateString('pt-BR');
}

// Função para atualizar o valor total das planos
function updatePlanoDisplay() {
    document.getElementById('totalPlanoDisplay').textContent = `R$ ${totalPlano.toFixed(2)}`;
}

// Carrega planos do Firestore ao carregar a página
function loadPlanosFromFirestore() {
    const userId = firebase.auth().currentUser.uid;

    db.collection('planos')
        .where('type', '==', 'plano')
        .where('user', '==', userId) // Filtra planos pelo UID do usuário autenticado
        .onSnapshot((querySnapshot) => {
            const table = document.getElementById('data-table');
            table.innerHTML = ''; // Limpa a tabela antes de adicionar as planos para evitar duplicação
            totalPlano = 0; // Reinicia o total de planos

            querySnapshot.forEach((doc) => {
                const plano = doc.data();
                addPlanoToTable(plano, doc.id);
                totalPlano += plano.amount;
            });
            updatePlanoDisplay(); // Atualiza o valor total das planos
        });
}

// Remove uma plano do Firestore
function removePlanoFromFirestore(planoId, planoValue) {
    db.collection('planos').doc(planoId).delete()
        .then(() => {
            const row = document.getElementById(`row-${planoId}`);
            if (row) {
                row.remove();
            }
            totalPlano -= planoValue;
            updatePlanoDisplay(); // Atualiza o valor total das planos
        })
        .catch(error => {
            console.error("Erro ao remover plano: ", error);
        });
}

// Atualiza uma plano no Firestore
function updatePlanoInFirestore(planoId, updatedPlano) {
    db.collection('planos').doc(planoId).update(updatedPlano)
        .then(() => {
            loadPlanosFromFirestore(); // Recarrega as planos após a atualização
        })
        .catch(error => {
            console.error("Erro ao atualizar plano: ", error);
        });
}

// Função para adicionar uma plano à tabela
function addPlanoToTable(plano, planoId) {
    const table = document.getElementById('data-table');
    const newRow = table.insertRow(-1);
    newRow.id = `row-${planoId}`;

    const descriptionCell = newRow.insertCell(0);
    descriptionCell.textContent = plano.description;

    const amountCell = newRow.insertCell(1);
    amountCell.textContent = `R$ ${plano.amount.toFixed(2)}`;

    const dateCell = newRow.insertCell(2);
    dateCell.textContent = formatarData(plano.date);

    // Adiciona o botão de editar
    const editCell = newRow.insertCell(3);
    const editButton = document.createElement('button');
    editButton.classList.add('edit-button');
    editButton.innerHTML = '<ion-icon name="create-outline" style="font-size: 20px;"></ion-icon>';
    editButton.title = "Editar"; // Define a legenda do botão de editar
    editButton.onclick = function() {
        // Função para editar a plano
        editPlano(planoId, plano);
    };
    editCell.appendChild(editButton);

    // Adiciona o botão de excluir
    const deleteCell = newRow.insertCell(4);
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.innerHTML = '<ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>';
    deleteButton.title = "Excluir"; // Define a legenda do botão de excluir
    deleteButton.onclick = function() {
        removePlanoFromFirestore(planoId, plano.amount);
    };
    deleteCell.appendChild(deleteButton);
}

// Variável para armazenar o ID da plano que está sendo editada
let editingPlanoId = null;

// Função para abrir o modal de edição e preencher os campos
function editPlano(planoId, plano) {
    // Preenche os campos do modal com as informações da plano
    document.getElementById('edit-description').value = plano.description;
    document.getElementById('edit-amount').value = plano.amount;
    document.getElementById('edit-date').value = plano.date;

    // Armazena o ID da plano que está sendo editada
    editingPlanoId = planoId;

    // Abre o modal de edição
    document.querySelector('.edit-modal-overlay').classList.add('active');
}

// Função para fechar o modal de edição
function closeEditModal() {
    document.querySelector('.edit-modal-overlay').classList.remove('active');
    editingPlanoId = null; // Limpa o ID da plano em edição
}

// Função para submeter o formulário de edição
function submitEditForm(event) {
    event.preventDefault();

    const description = document.getElementById('edit-description').value;
    const amount = parseFloat(document.getElementById('edit-amount').value);
    const date = document.getElementById('edit-date').value;

    if (description === '' || isNaN(amount) || date === '') {
        showToast("Por favor, preencha todos os campos corretamente!");
        return;
    }

    const updatedPlano = {
        description: description,
        amount: amount,
        date: date
    };

    // Atualiza a plano no Firestore
    updatePlanoInFirestore(editingPlanoId, updatedPlano);

    // Fecha o modal após salvar
    closeEditModal();
}


// Evento de submissão do formulário para adicionar planos
function submitForm(event) {
    event.preventDefault();

    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;

    if (description === '' || isNaN(amount) || date === '') {
        showToast("Por favor, preencha todos os campos!");
        return;
    }

    savePlano(description, amount, date); // Salva a plano
}

// Função para mostrar uma mensagem de erro (toast)
function showToast(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.description').textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Inicializa o carregamento das planos ao carregar a página
window.onload = function() {
    // Verifica se o usuário está autenticado antes de carregar as planos
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadPlanosFromFirestore();
        } else {
            console.log("Usuário não autenticado.");
        }
    });
};

// Função para salvar plano no Firestore
function savePlano(description, amount, date) {
    const planoData = {
        description: description,
        amount: parseFloat(amount),
        date: date,
        type: "plano",
        user: firebase.auth().currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("planos").add(planoData)
        .then(() => {
            console.log("Plano salvp com sucesso!");
        })
        .catch((error) => {
            console.error("Erro ao salvar plano: ", error);
        });
}

// Captura o submit do formulário
document.querySelector('form').addEventListener('submit', submitForm);

// Verifica o estado de autenticação do usuário
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        // Usuário está logado
        const userEmail = user.email; // Pega o email do usuário
        const userName = user.displayName; // Pega o nome do usuário, se estiver disponível
        
        // Exibe o email ou nome do usuário no DOM
        document.getElementById('user-email').textContent = userName ? userName : userEmail;
    } else {
        // Usuário não está logado
        document.getElementById('user-info').textContent = "Nenhum usuário logado.";
    }
});

// Função para manipular o modal de filtro
const FilterModal = {
    open() {
        document.querySelector('.filter-modal-overlay').classList.add('active');
    },
    close() {
        document.querySelector('.filter-modal-overlay').classList.remove('active');
    }
};

// Função para filtrar planos com base nos critérios fornecidos
function filterPlanos(event) {
    event.preventDefault(); // Evita o envio padrão do formulário

    // Obtém os valores dos campos de filtro
    const descricao = document.getElementById('descricao').value.toLowerCase().trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;

    const userId = firebase.auth().currentUser.uid;

    // Consulta filtrada no Firestore
    let query = db.collection('planos')
        .where('type', '==', 'plano')
        .where('user', '==', userId);

    if (descricao) {
        query = query.where('description', '==', descricao);
    }
    if (!isNaN(valor)) {
        query = query.where('amount', '==', valor);
    }
    if (data) {
        query = query.where('date', '==', data);
    }

    query.get().then((querySnapshot) => {
        const table = document.getElementById('data-table');
        table.innerHTML = ''; // Limpa a tabela antes de adicionar as planos filtradas
        let totalFiltered = 0; // Inicializa a soma dos valores filtrados

        querySnapshot.forEach((doc) => {
            const plano = doc.data();
            addPlanoToTable(plano, doc.id);
            totalFiltered += plano.amount;
        });

        // Atualiza o valor total das planos filtradas
        document.getElementById('filteredPlanoDisplay').textContent = `R$ ${totalFiltered.toFixed(2)}`;

        FilterModal.close(); // Fecha o modal de filtro
    }).catch((error) => {
        console.error("Erro ao filtrar planos: ", error);
    });
}

// Função para limpar o filtro
function filterClear() {
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('data').value = '';

    // Recarrega todas as planos após limpar o filtro
    loadPlanosFromFirestore();
    document.getElementById('filteredPlanoDisplay').textContent = `R$ 0,00`;
}