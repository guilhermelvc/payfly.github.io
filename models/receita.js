// Inicializa as variáveis necessárias
const db = firebase.firestore();
let totalReceita = 0;

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

// Função para atualizar o valor total das receitas
function updateReceitaDisplay() {
    document.getElementById('totalReceitaDisplay').textContent = `R$ ${totalReceita.toFixed(2)}`;
}

// Carrega receitas do Firestore ao carregar a página
function loadReceitasFromFirestore() {
    const userId = firebase.auth().currentUser.uid;

    db.collection('receitas')
        .where('type', '==', 'receita')
        .where('user', '==', userId) // Filtra receitas pelo UID do usuário autenticado
        .onSnapshot((querySnapshot) => {
            const table = document.getElementById('data-table');
            table.innerHTML = ''; // Limpa a tabela antes de adicionar as receitas para evitar duplicação
            totalReceita = 0; // Reinicia o total de receitas

            querySnapshot.forEach((doc) => {
                const receita = doc.data();
                addReceitaToTable(receita, doc.id);
                totalReceita += receita.amount;
            });
            updateReceitaDisplay(); // Atualiza o valor total das receitas
        });
}

// Remove uma receita do Firestore
function removeReceitaFromFirestore(receitaId, receitaValue) {
    db.collection('receitas').doc(receitaId).delete()
        .then(() => {
            const row = document.getElementById(`row-${receitaId}`);
            if (row) {
                row.remove();
            }
            totalReceita -= receitaValue;
            updateReceitaDisplay(); // Atualiza o valor total das receitas
        })
        .catch(error => {
            console.error("Erro ao remover receita: ", error);
        });
}

// Atualiza uma receita no Firestore
function updateReceitaInFirestore(receitaId, updatedReceita) {
    db.collection('receitas').doc(receitaId).update(updatedReceita)
        .then(() => {
            loadReceitasFromFirestore(); // Recarrega as receitas após a atualização
        })
        .catch(error => {
            console.error("Erro ao atualizar receita: ", error);
        });
}

// Função para adicionar uma receita à tabela
function addReceitaToTable(receita, receitaId) {
    const table = document.getElementById('data-table');
    const newRow = table.insertRow(-1);
    newRow.id = `row-${receitaId}`;

    const descriptionCell = newRow.insertCell(0);
    descriptionCell.textContent = receita.description;

    const amountCell = newRow.insertCell(1);
    amountCell.textContent = `R$ ${receita.amount.toFixed(2)}`;

    const dateCell = newRow.insertCell(2);
    dateCell.textContent = formatarData(receita.date);

    // Adiciona o botão de editar
    const editCell = newRow.insertCell(3);
    const editButton = document.createElement('button');
    editButton.classList.add('edit-button');
    editButton.innerHTML = '<ion-icon name="create-outline" style="font-size: 20px;"></ion-icon>';
    editButton.title = "Editar"; // Define a legenda do botão de editar
    editButton.onclick = function() {
        // Função para editar a receita
        editReceita(receitaId, receita);
    };
    editCell.appendChild(editButton);

    // Adiciona o botão de excluir
    const deleteCell = newRow.insertCell(4);
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.innerHTML = '<ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>';
    deleteButton.title = "Excluir"; // Define a legenda do botão de excluir
    deleteButton.onclick = function() {
        removeReceitaFromFirestore(receitaId, receita.amount);
    };
    deleteCell.appendChild(deleteButton);
}

// Variável para armazenar o ID da receita que está sendo editada
let editingReceitaId = null;

// Função para abrir o modal de edição e preencher os campos
function editReceita(receitaId, receita) {
    // Preenche os campos do modal com as informações da receita
    document.getElementById('edit-description').value = receita.description;
    document.getElementById('edit-amount').value = receita.amount;
    document.getElementById('edit-date').value = receita.date;

    // Armazena o ID da receita que está sendo editada
    editingReceitaId = receitaId;

    // Abre o modal de edição
    document.querySelector('.edit-modal-overlay').classList.add('active');
}

// Função para fechar o modal de edição
function closeEditModal() {
    document.querySelector('.edit-modal-overlay').classList.remove('active');
    editingReceitaId = null; // Limpa o ID da receita em edição
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

    const updatedReceita = {
        description: description,
        amount: amount,
        date: date
    };

    // Atualiza a receita no Firestore
    updateReceitaInFirestore(editingReceitaId, updatedReceita);

    // Fecha o modal após salvar
    closeEditModal();
}


// Evento de submissão do formulário para adicionar receitas
function submitForm(event) {
    event.preventDefault();

    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;

    if (description === '' || isNaN(amount) || date === '') {
        showToast("Por favor, preencha todos os campos!");
        return;
    }

    saveReceita(description, amount, date); // Salva a receita
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

// Inicializa o carregamento das receitas ao carregar a página
window.onload = function() {
    // Verifica se o usuário está autenticado antes de carregar as receitas
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadReceitasFromFirestore();
        } else {
            console.log("Usuário não autenticado.");
        }
    });
};

// Função para salvar receita no Firestore
function saveReceita(description, amount, date) {
    const receitaData = {
        description: description,
        amount: parseFloat(amount),
        date: date,
        type: "receita",
        user: firebase.auth().currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("receitas").add(receitaData)
        .then(() => {
            console.log("Receita salva com sucesso!");
        })
        .catch((error) => {
            console.error("Erro ao salvar receita: ", error);
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

// Função para filtrar receitas com base nos critérios fornecidos
function filterReceitas(event) {
    event.preventDefault(); // Evita o envio padrão do formulário

    // Obtém os valores dos campos de filtro
    const descricao = document.getElementById('descricao').value.toLowerCase().trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;

    const userId = firebase.auth().currentUser.uid;

    // Consulta filtrada no Firestore
    let query = db.collection('receitas')
        .where('type', '==', 'receita')
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
        table.innerHTML = ''; // Limpa a tabela antes de adicionar as receitas filtradas
        let totalFiltered = 0; // Inicializa a soma dos valores filtrados

        querySnapshot.forEach((doc) => {
            const receita = doc.data();
            addReceitaToTable(receita, doc.id);
            totalFiltered += receita.amount;
        });

        // Atualiza o valor total das receitas filtradas
        document.getElementById('filteredReceitaDisplay').textContent = `R$ ${totalFiltered.toFixed(2)}`;

        FilterModal.close(); // Fecha o modal de filtro
    }).catch((error) => {
        console.error("Erro ao filtrar receitas: ", error);
    });
}

// Função para limpar o filtro
function filterClear() {
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('data').value = '';

    // Recarrega todas as receitas após limpar o filtro
    loadReceitasFromFirestore();
    document.getElementById('filteredReceitaDisplay').textContent = `R$ 0,00`;
}