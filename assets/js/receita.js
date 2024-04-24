// Função para manipular o modal de adicionar e filtro
const Modal = {
    open() {
        document.querySelector('.modal-overlay').classList.add('active');
    },
    close() {
        document.querySelector('.modal-overlay').classList.remove('active');
    },
    openFilter() {
        // Lógica para abrir o modal de filtro, se necessário
    }
};

// Variável para armazenar o total das Receitas
let totalReceita = 0;

const Transaction = {
    add(transaction, monthIndex) {
        const table = document.getElementById('data-table');
        const newRow = table.insertRow(-1);

        const descriptionCell = newRow.insertCell(0);
        descriptionCell.textContent = transaction.description;

        const amountCell = newRow.insertCell(1);
        amountCell.textContent = `R$ ${transaction.amount.toFixed(2)}`;

        const dateCell = newRow.insertCell(2);
        dateCell.textContent = formatarData(transaction.date); // Formata a data aqui

        const deleteCell = newRow.insertCell(3);
        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.innerHTML = '<ion-icon name="trash-outline" style="font-size: 20px;"></ion-icon>';
        deleteButton.onclick = function() {
            table.deleteRow(newRow.rowIndex);
            totalReceita -= transaction.amount;
            updateReceitaDisplay(); // Atualiza o valor total das receitas
            removeTransactionFromLocalStorage(transaction);
            // Atualiza o valor total das receitas após deletar a transação
            totalReceitaDisplay.textContent = `R$ ${totalReceita.toFixed(2)}`;
            filteredReceitaDisplay.textContent = `R$ ${getTotalFilteredReceita().toFixed(2)}`;
        };
        deleteCell.appendChild(deleteButton);

        // Atualiza o valor total das receitas ao adicionar uma nova transação
        totalReceita += transaction.amount;
        updateReceitaDisplay(); // Atualiza o valor total das receitas

        saveTransactionToLocalStorage(transaction);
    }
};

// Função para salvar transação no localStorage
function saveTransactionToLocalStorage(transaction) {
    let transactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];
    // Verifica se a transação já existe no localStorage
    const existingTransactionIndex = transactions.findIndex(t => isEqualTransaction(t, transaction));
    if (existingTransactionIndex === -1) {
        transactions.push(transaction);
        localStorage.setItem('receita_transactions', JSON.stringify(transactions));
    }
}

// Função para remover transação do localStorage
function removeTransactionFromLocalStorage(transaction) {
    let transactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];
    transactions = transactions.filter(t => !isEqualTransaction(t, transaction));
    localStorage.setItem('receita_transactions', JSON.stringify(transactions));
}

// Função para verificar se duas transações são iguais
function isEqualTransaction(transaction1, transaction2) {
    return (
        transaction1.description === transaction2.description &&
        transaction1.amount === transaction2.amount &&
        transaction1.date === transaction2.date
    );
}

// Função para carregar transações do localStorage ao carregar a página
function loadTransactionsFromLocalStorage() {
    let transactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];
    // Limpa a tabela antes de adicionar as transações para evitar duplicação
    const table = document.getElementById('data-table');
    table.innerHTML = '<thead><tr><td>Descrição</td><td>Valor</td><td>Data</td><th></th></tr></thead>';
    // Adiciona as transações à tabela
    transactions.forEach(transaction => {
        Transaction.add(transaction);
    });
}

// Evento para carregar transações do localStorage ao carregar a página
window.addEventListener('DOMContentLoaded', function () {
    loadTransactionsFromLocalStorage();
    updateReceitaDisplay();
});

// Função para atualizar a exibição do total de Receitas nos cartões
function updateReceitaDisplay() {
    console.log("Atualizando exibição de receitas");

    // Obtém os elementos de exibição dos valores totais e filtrados
    const totalReceitaDisplay = document.getElementById('totalReceitaDisplay');
    const filteredReceitaDisplay = document.getElementById('filteredReceitaDisplay');

    // Calcula o valor total de todas as transações
    const totalReceita = getTotalReceita();

    // Atualiza o valor no cartão de receitas totais
    totalReceitaDisplay.textContent = `R$ ${totalReceita.toFixed(2)}`;

    // Se houver transações filtradas, calcule o valor total com base nelas
    if (hasFilteredTransactions()) {
        const totalFilteredReceita = getTotalFilteredReceita();

        // Atualiza o valor no cartão de receitas filtradas
        filteredReceitaDisplay.textContent = `R$ ${totalFilteredReceita.toFixed(2)}`;
    } else {
        // Caso contrário, exiba o valor total de todas as transações nos dois cartões
        filteredReceitaDisplay.textContent = `R$ ${totalReceita.toFixed(2)}`;
    }
}

// Função para obter o total de receitas
function getTotalReceita() {
    const transactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];
    return transactions.reduce((total, transaction) => total + transaction.amount, 0);
}

// Função para verificar se existem transações filtradas
function hasFilteredTransactions() {
    const transactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];
    return transactions.some(transaction => transaction.filtered);
}

// Função para calcular o valor total das receitas filtradas
function getTotalFilteredReceita() {
    const transactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];
    return transactions.reduce((total, transaction) => {
        if (isTransactionFiltered(transaction)) {
            return total + transaction.amount;
        } else {
            return total;
        }
    }, 0);
}

// Funções para manipular o formulário
const Form = {
    submit(event) {
        event.preventDefault();
    
        try {
            Form.validateFields();
            const transaction = Form.formatValues();
            const monthIndex = Form.getDataByTransaction(transaction.date);
    
            // Adiciona uma propriedade "filtered" à transação se estiver filtrada
            if (transaction.filtered) {
                transaction.filtered = true;
            }
    
            Transaction.add(transaction, monthIndex);
            Form.clearFields();
    
            Modal.close();
    
            // Atualiza a exibição das receitas após adicionar uma transação
            updateReceitaDisplay(); 
        } catch (error) {
            console.warn(error.message);
            toastError(error.message);
        }
    },
    
    validateFields() {
        // Lógica para validar os campos do formulário
        const description = document.getElementById('description').value;
        const amount = document.getElementById('amount').value;
        const date = document.getElementById('date').value;

        if (!description || !amount || !date) {
            throw new Error("Por favor, preencha todos os campos!");
        }
    },
    formatValues() {
        // Lógica para formatar os valores do formulário
        const description = document.getElementById('description').value;
        const amount = parseFloat(document.getElementById('amount').value.replace(',', '.'));
        const date = document.getElementById('date').value;

        return {
            description,
            amount,
            date
        };
    },
    getDataByTransaction(date) {
        // Lógica para obter o índice do mês da transação
        const monthIndex = 0; // Exemplo: Janeiro é 0, Fevereiro é 1, etc.
        return monthIndex;
    },
    clearFields() {
        // Lógica para limpar os campos do formulário após a submissão
        document.getElementById('description').value = '';
        document.getElementById('amount').value = '';
        document.getElementById('date').value = '';
    }
};

// Função para exibir toast de erro
function toastError(message) {
    const toast = document.getElementById('toast');
    toast.querySelector('.description').textContent = message;
    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Event  para fechar o toast ao clicar no botão 'X'
document.getElementById('toast').addEventListener('click', function () {
    this.classList.remove('show');
});

// Event para abrir o modal ao clicar no botão "+ Adicionar Receita"
document.querySelector('.add-transaction-button').addEventListener('click', Modal.open);

// Event para fechar o modal ao clicar no botão "Cancelar"
document.querySelectorAll('.button.cancel').forEach(button => {
    button.addEventListener('click', Modal.close);
});

// Função para manipular o modal de filtro
const FilterModal = {
    open() {
        document.querySelector('.filter-modal-overlay').classList.add('active');
        // Oculta o botão "Fechar" do modal
        document.querySelector('.filter-modal .close-filter-modal').style.display = 'none';
    },
    close() {
        document.querySelector('.filter-modal-overlay').classList.remove('active');
    }
};

// Função para formatar a data para o formato "dd/mm/aaaa"
function formatarData(data) {
    const dataObj = new Date(data);
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Mês começa do zero
    const ano = dataObj.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

//Função para lidar com a submissão do formulário de filtro
document.getElementById('filter-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value.trim());
    const data = document.getElementById('data').value.trim();

    // Carrega as transações do localStorage
    let transactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];

    // Filtra as transações com base nos critérios fornecidos
    const filteredTransactions = transactions.filter(transaction => {
        // Filtra por descrição (se houver)
        const descricaoMatches = descricao ? transaction.description.toLowerCase().includes(descricao.toLowerCase()) : true;

        // Filtra por valor (se houver)
        const valorMatches = !isNaN(valor) ? transaction.amount === valor : true;

        // Filtra por data (se houver)
        const dataMatches = data ? transaction.date === data : true;

        // Retorna true se todos os critérios forem atendidos
        return descricaoMatches && valorMatches && dataMatches;
    });

    // Limpa a tabela antes de adicionar as transações filtradas
    const table = document.getElementById('data-table');
    table.innerHTML = '<thead><tr><td>Descrição</td><td>Valor</td><td>Data</td><th></th></tr></thead>';

    // Adiciona as transações filtradas à tabela
    filteredTransactions.forEach(transaction => {
        Transaction.add(transaction);
    });

    // Atualiza a exibição das receitas filtradas após filtrar as transações
    updateFilteredReceitaDisplay();

    // Fecha o modal de filtro após a filtragem
    FilterModal.close();
});

// Função para atualizar a exibição do total de Receitas filtradas nos cartões
function updateFilteredReceitaDisplay() {
    console.log("Atualizando exibição de receitas filtradas");

    // Obtém o elemento de exibição do valor total filtrado
    const filteredReceitaDisplay = document.getElementById('filteredReceitaDisplay');

    // Calcula o valor total das transações filtradas
    const totalFilteredReceita = getTotalFilteredReceita();

    // Atualiza o valor no cartão de receitas filtradas
    filteredReceitaDisplay.textContent = `R$ ${totalFilteredReceita.toFixed(2)}`;
}

// Event listener para lidar com o cancelamento do filtro ao clicar no botão "Cancelar"
document.querySelector('.filter-modal .cancel').addEventListener('click', function() {
    // Fecha o modal de filtro
    FilterModal.close();

    // Limpa os campos do formulário de filtro
    document.getElementById('filter-form').reset();

    // Carrega todas as transações do localStorage
    loadTransactionsFromLocalStorage();
});

// Função para limpar o filtro e carregar todas as transações
function filterClear() {
    // Fecha o modal de filtro
    FilterModal.close();

    // Limpa os campos do formulário de filtro
    document.getElementById('filter-form').reset();

    // Carrega todas as transações do localStorage
    loadTransactionsFromLocalStorage();
}

function isTransactionFiltered(transaction) {
    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value.trim());
    const data = document.getElementById('data').value.trim();

    // Verifica se a transação atende aos critérios de filtro
    const descricaoMatches = descricao ? transaction.description.toLowerCase().includes(descricao.toLowerCase()) : true;
    const valorMatches = !isNaN(valor) ? transaction.amount === valor : true;
    const dataMatches = data ? transaction.date === data : true;

    return descricaoMatches && valorMatches && dataMatches;
}