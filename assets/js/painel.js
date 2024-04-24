// Variável para controlar a ordenação da tabela
let ordemDataCrescente = true;

// Função para calcular o saldo total
function calcularSaldoTotal(despesas, receitas) {
    return receitas - despesas;
}

// Função para preencher os cards com os totais
function preencherCards(despesas, receitas) {
    document.getElementById('totalDespesas').textContent = `R$ ${despesas.toFixed(2)}`;
    document.getElementById('totalReceitas').textContent = `R$ ${receitas.toFixed(2)}`;

    const saldoTotal = receitas - despesas;
    document.getElementById('saldoTotal').textContent = `R$ ${saldoTotal.toFixed(2)}`;
}

// Obtém os dados das transações do localStorage de receita e despesa
function obterTransacoes() {
    const despesaTransactions = JSON.parse(localStorage.getItem('despesa_transactions')) || [];
    const receitaTransactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];

    return [...despesaTransactions, ...receitaTransactions];
}

// Função para calcular o total de despesas
function calcularTotalDespesas(transacoes) {
    return transacoes.reduce((total, transacao) => {
        if (transacao.amount < 0) {
            return total + Math.abs(transacao.amount);
        } else {
            return total;
        }
    }, 0);
}

// Função para calcular o total de receitas
function calcularTotalReceitas(transacoes) {
    return transacoes.reduce((total, transacao) => {
        if (transacao.amount > 0 && transacao.tipo !== 'Plano') { // Excluindo os planos da soma
            return total + transacao.amount;
        } else {
            return total;
        }
    }, 0);
}

// Função principal para preencher a página com os dados
function preencherPagina() {
    const transacoes = obterTransacoes();
    const totalDespesas = calcularTotalDespesas(transacoes);
    const totalReceitas = calcularTotalReceitas(transacoes);

    preencherCards(totalDespesas, totalReceitas);
    preencherTabela(transacoes);
}

// Função para formatar a data para o formato "dd/mm/aaaa"
function formatarData(data) {
    const dataObj = new Date(data);
    const dia = String(dataObj.getDate()).padStart(2, '0');
    const mes = String(dataObj.getMonth() + 1).padStart(2, '0'); // Mês começa do zero
    const ano = dataObj.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// Função para preencher a tabela com os dados das transações
function preencherTabela(transacoes) {
    const tableBody = document.getElementById('data-table-body');
    tableBody.innerHTML = '';

    transacoes.forEach(transacao => {
        const row = tableBody.insertRow();
        row.innerHTML = `
            <td>${transacao.description}</td>
            <td>R$ ${transacao.amount.toFixed(2)}</td>
            <td>${formatarData(transacao.date)}</td>
            <td>
                <div class="status-card" style="background-color: ${transacao.statusColor}">
                    ${transacao.tipo}
                </div>
            </td>
        `;
    });
}

// Função para obter as transações com o campo "tipo" adicionado
function obterTransacoes() {
    const despesaTransactions = JSON.parse(localStorage.getItem('despesa_transactions')) || [];
    const receitaTransactions = JSON.parse(localStorage.getItem('receita_transactions')) || [];
    const planoTransactions = JSON.parse(localStorage.getItem('plano_transactions')) || [];

    // formatando os status para exibição na tabela
    const despesaTransactionsWithType = despesaTransactions.map(transacao => ({ ...transacao, tipo: 'Despesa', statusColor: 'red' }));
    const receitaTransactionsWithType = receitaTransactions.map(transacao => ({ ...transacao, tipo: 'Receita', statusColor: 'green' }));
    const planoTransactionsWithType = planoTransactions.map(transacao => ({ ...transacao, tipo: 'Plano', statusColor: 'blue' }));

    return [ ...despesaTransactionsWithType, ...planoTransactionsWithType, ...receitaTransactionsWithType];
}

// Função para ordenar as transações por data
function ordenarPorData(transacoes) {
    return transacoes.slice().sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        if (ordemDataCrescente) {
            return dateA - dateB;
        } else {
            return dateB - dateA;
        }
    });
}

// Função para atualizar a tabela com a ordenação
function atualizarTabelaOrdenada() {
    const transacoes = obterTransacoes();
    const sortedTransacoes = ordenarPorData(transacoes);
    preencherTabela(sortedTransacoes);
}

// Evento para chamar a função principal ao carregar a página
window.addEventListener('DOMContentLoaded', preencherPagina);

// Evento para chamar a função de atualizar tabela ao clicar no botão
document.getElementById('btnOrdenarPorData').addEventListener('click', () => {
    ordemDataCrescente = !ordemDataCrescente;
    atualizarTabelaOrdenada();
});
