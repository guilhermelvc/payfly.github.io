// Inicializa as variáveis necessárias
const db = firebase.firestore();
let totalDespesa = 0;

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

// Função para atualizar o valor total das despesas
function updateDespesaDisplay() {
    document.getElementById('totalDespesaDisplay').textContent = `R$ ${totalDespesa.toFixed(2)}`;
}

// Carrega Despesas do Firestore ao carregar a página
function loadDespesasFromFirestore() {
    const userId = firebase.auth().currentUser.uid;

    db.collection('despesas')
        .where('type', '==', 'despesa')
        .where('user', '==', userId) // Filtra despesas pelo UID do usuário autenticado
        .onSnapshot((querySnapshot) => {
            const table = document.getElementById('data-table');
            table.innerHTML = ''; // Limpa a tabela antes de adicionar as despesas para evitar duplicação
            totalDespesa = 0; // Reinicia o total de Despesas

            querySnapshot.forEach((doc) => {
                const despesa = doc.data();
                addDespesaToTable(despesa, doc.id);
                totalDespesa += despesa.amount;
            });
            updateDespesaDisplay(); // Atualiza o valor total das despesas
        });
}

// Remove uma despesa do Firestore
function removeDespesaFromFirestore(despesaId, despesaValue) {
    db.collection('despesas').doc(despesaId).delete()
        .then(() => {
            const row = document.getElementById(`row-${despesaId}`);
            if (row) {
                row.remove();
            }
            totalDespesa -= despesaValue;
            updateDespesaDisplay(); // Atualiza o valor total das Despesas
        })
        .catch(error => {
            console.error("Erro ao remover despesa: ", error);
        });
}

// Atualiza uma Despesa no Firestore
function updateDespesaInFirestore(despesaId, updatedDespesa) {
    db.collection('despesas').doc(despesaId).update(updatedDespesa)
        .then(() => {
            loadDespesasFromFirestore(); // Recarrega as Despesas após a atualização
        })
        .catch(error => {
            console.error("Erro ao atualizar despesa: ", error);
        });
}

// Função para adicionar uma despesa à tabela
function addDespesaToTable(despesa, despesaId) {
    const table = document.getElementById('data-table');
    const newRow = table.insertRow(-1);
    newRow.id = `row-${despesaId}`;

    const descriptionCell = newRow.insertCell(0);
    descriptionCell.textContent = despesa.description;

    const amountCell = newRow.insertCell(1);
    amountCell.textContent = `R$ ${despesa.amount.toFixed(2)}`;

    const dateCell = newRow.insertCell(2);
    dateCell.textContent = formatarData(despesa.date);

    // Adiciona o botão de editar
    const editCell = newRow.insertCell(3);
    const editButton = document.createElement('button');
    editButton.classList.add('edit-button');
    editButton.innerHTML = '<ion-icon name="create-outline" style="font-size: 20px;"></ion-icon>';
    editButton.title = "Editar"; // Define a legenda do botão de editar
    editButton.onclick = function() {
        // Função para editar a despesa
        editDespesa(despesaId, despesa);
    };
    editCell.appendChild(editButton);

    // Adiciona o botão de excluir
    const deleteCell = newRow.insertCell(4);
    const deleteButton = document.createElement('button');
    deleteButton.classList.add('delete-button');
    deleteButton.innerHTML = '<ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>';
    deleteButton.title = "Excluir"; // Define a legenda do botão de excluir
    deleteButton.onclick = function() {
        removeDespesaFromFirestore(despesaId, despesa.amount);
    };
    deleteCell.appendChild(deleteButton);
}

// Variável para armazenar o ID da despesa que está sendo editada
let editingDespesaId = null;

// Função para abrir o modal de edição e preencher os campos
function editDespesa(despesaId, despesa) {
    // Preenche os campos do modal com as informações da despesa
    document.getElementById('edit-description').value = despesa.description;
    document.getElementById('edit-amount').value = despesa.amount;
    document.getElementById('edit-date').value = despesa.date;

    // Armazena o ID da despesa que está sendo editada
    editingDespesaId = despesaId;

    // Abre o modal de edição
    document.querySelector('.edit-modal-overlay').classList.add('active');
}

// Função para fechar o modal de edição
function closeEditModal() {
    document.querySelector('.edit-modal-overlay').classList.remove('active');
    editingDespesaId = null; // Limpa o ID da Despesa em edição
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

    const updatedDespesa = {
        description: description,
        amount: amount,
        date: date
    };

    // Atualiza a Despesa no Firestore
    updateDespesaInFirestore(editingDespesaId, updatedDespesa);

    // Fecha o modal após salvar
    closeEditModal();
}


// Evento de submissão do formulário para adicionar despesas
function submitForm(event) {
    event.preventDefault();

    const description = document.getElementById('description').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;

    if (description === '' || isNaN(amount) || date === '') {
        showToast("Por favor, preencha todos os campos!");
        return;
    }

    saveDespesa(description, amount, date); // Salva a Despesa
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

// Inicializa o carregamento das Despesas ao carregar a página
window.onload = function() {
    // Verifica se o usuário está autenticado antes de carregar as Despesas
    firebase.auth().onAuthStateChanged((user) => {
        if (user) {
            loadDespesasFromFirestore();
        } else {
            console.log("Usuário não autenticado.");
        }
    });
};

// Função para salvar Despesa no Firestore
function saveDespesa(description, amount, date) {
    const despesaData = {
        description: description,
        amount: parseFloat(amount),
        date: date,
        type: "despesa",
        user: firebase.auth().currentUser.uid,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("despesas").add(despesaData)
        .then(() => {
            console.log("Despesa salva com sucesso!");
        })
        .catch((error) => {
            console.error("Erro ao salvar despesa: ", error);
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

// Função para filtrar despesas com base nos critérios fornecidos
function filterDespesas(event) {
    event.preventDefault(); // Evita o envio padrão do formulário

    // Obtém os valores dos campos de filtro
    const descricao = document.getElementById('descricao').value.toLowerCase().trim();
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;

    const userId = firebase.auth().currentUser.uid;

    // Consulta filtrada no Firestore
    let query = db.collection('despesas')
        .where('type', '==', 'despesa')
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
        table.innerHTML = ''; // Limpa a tabela antes de adicionar as despesas filtradas
        let totalFiltered = 0; // Inicializa a soma dos valores filtrados

        querySnapshot.forEach((doc) => {
            const despesa = doc.data();
            addDespesaToTable(despesa, doc.id);
            totalFiltered += despesa.amount;
        });

        // Atualiza o valor total das despesas filtradas
        document.getElementById('filteredDespesaDisplay').textContent = `R$ ${totalFiltered.toFixed(2)}`;

        FilterModal.close(); // Fecha o modal de filtro
    }).catch((error) => {
        console.error("Erro ao filtrar despesas: ", error);
    });
}

// Função para limpar o filtro
function filterClear() {
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('data').value = '';

    // Recarrega todas as despesas após limpar o filtro
    loadDespesasFromFirestore();
    document.getElementById('filteredDespesaDisplay').textContent = `R$ 0,00`;
}