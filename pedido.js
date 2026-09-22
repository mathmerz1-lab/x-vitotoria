(function () {
    'use strict';

    var CHAVE_CARRINHO = 'carrinhoXvitoria';

    var lista = document.getElementById('lista-carrinho');
    var totalElemento = document.getElementById('total-carrinho');
    var formulario = document.getElementById('form-pedido');

    // Forma de pagamento
    var radiosPagamento = document.querySelectorAll('input[name="pagamento"]');
    var campoBandeira = document.getElementById('campo-bandeira'); // continua null, e tudo bem
    var selectBandeira = document.getElementById('bandeira-cartao');


    function pegarCarrinho() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || [];
        } catch (erro) {
            return [];
        }
    }


    function salvarCarrinho(carrinho) {
        localStorage.setItem(
            CHAVE_CARRINHO,
            JSON.stringify(carrinho)
        );
    }


    function formatarPreco(valor) {
        return valor.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }


    function calcularTotal(carrinho) {
        return carrinho.reduce(function (total, item) {
            return total + (item.preco * item.quantidade);
        }, 0);
    }


    // Mostra o campo "Bandeira do cartão" só quando "Cartão" estiver marcado
    function atualizarCampoBandeira() {

        if (!campoBandeira) {
            return;
        }

        var selecionado =
            document.querySelector('input[name="pagamento"]:checked');

        var eCartao =
            selecionado && selecionado.value === 'Cartão de crédito/débito';

        campoBandeira.hidden = !eCartao;
    }


    function mostrarCarrinho() {

        var carrinho = pegarCarrinho();

        lista.innerHTML = '';


        if (carrinho.length === 0) {

            lista.innerHTML = `
                <div class="carrinho-vazio">
                    <i class="bi bi-cart-x"></i>
                    <p>Seu carrinho está vazio.</p>
                    <a class="btn btn-contorno btn-pequeno" href="index.html">
                        Voltar ao cardápio
                    </a>
                </div>
            `;

            totalElemento.textContent = 'R$ 0,00';

            return;
        }


        carrinho.forEach(function (item, indice) {

            var produto = document.createElement('div');

            produto.className = 'carrinho-item';

            produto.innerHTML = `
                <div>
                    <div class="carrinho-item-nome">
                        ${item.nome}
                    </div>

                    <div class="carrinho-item-preco">
                        ${formatarPreco(item.preco)} cada
                    </div>
                </div>

                <div class="carrinho-controles">

                    <button
                        type="button"
                        class="btn-diminuir"
                        data-indice="${indice}"
                        aria-label="Diminuir quantidade"
                    >
                        <i class="bi bi-dash-lg"></i>
                    </button>

                    <span class="carrinho-quantidade">
                        ${item.quantidade}
                    </span>

                    <button
                        type="button"
                        class="btn-aumentar"
                        data-indice="${indice}"
                        aria-label="Aumentar quantidade"
                    >
                        <i class="bi bi-plus-lg"></i>
                    </button>

                    <button
                        type="button"
                        class="carrinho-remover"
                        data-indice="${indice}"
                        aria-label="Remover produto"
                    >
                        <i class="bi bi-trash3"></i>
                    </button>

                </div>
            `;

            lista.appendChild(produto);
        });


        totalElemento.textContent =
            formatarPreco(calcularTotal(carrinho));


        configurarBotoes();
    }


    function configurarBotoes() {

        document.querySelectorAll('.btn-aumentar')
            .forEach(function (botao) {

                botao.addEventListener('click', function () {

                    var indice = Number(botao.dataset.indice);

                    var carrinho = pegarCarrinho();

                    carrinho[indice].quantidade++;

                    salvarCarrinho(carrinho);

                    mostrarCarrinho();
                });
            });


        document.querySelectorAll('.btn-diminuir')
            .forEach(function (botao) {

                botao.addEventListener('click', function () {

                    var indice = Number(botao.dataset.indice);

                    var carrinho = pegarCarrinho();

                    carrinho[indice].quantidade--;

                    if (carrinho[indice].quantidade <= 0) {
                        carrinho.splice(indice, 1);
                    }

                    salvarCarrinho(carrinho);

                    mostrarCarrinho();
                });
            });


        document.querySelectorAll('.carrinho-remover')
            .forEach(function (botao) {

                botao.addEventListener('click', function () {

                    var indice = Number(botao.dataset.indice);

                    var carrinho = pegarCarrinho();

                    carrinho.splice(indice, 1);

                    salvarCarrinho(carrinho);

                    mostrarCarrinho();
                });
            });
    }


    // Alterna a exibição da bandeira sempre que a forma de pagamento muda
    radiosPagamento.forEach(function (radio) {
        radio.addEventListener('change', atualizarCampoBandeira);
    });


    formulario.addEventListener('submit', function (evento) {

        evento.preventDefault();


        var carrinho = pegarCarrinho();


        if (carrinho.length === 0) {
            alert('Seu carrinho está vazio.');
            return;
        }


        var nome = document.getElementById('nome').value.trim();

        var endereco =
            document.getElementById('endereco').value.trim();

        var complemento =
            document.getElementById('complemento').value.trim();

        var observacao =
            document.getElementById('observacao').value.trim();

        var troco =
            document.getElementById('troco').value.trim();

        var radioPagamento =
            document.querySelector('input[name="pagamento"]:checked');


        if (!radioPagamento) {
            alert('Selecione a forma de pagamento.');
            return;
        }

        var formaPagamento = radioPagamento.value;

        var bandeira = selectBandeira.value;


        var total = calcularTotal(carrinho);


        var mensagem =
            '🍔 *NOVO PEDIDO - X VITÓRIA*%0A%0A';


        mensagem +=
            '*Nome:* ' +
            nome +
            '%0A%0A';


        mensagem += '*Pedido:*%0A';


        carrinho.forEach(function (item) {

            var subtotal =
                item.preco * item.quantidade;

            mensagem +=
                '• ' +
                item.nome +
                ' — ' +
                item.quantidade +
                'x ' +
                formatarPreco(subtotal) +
                '%0A';
        });


        mensagem +=
            '%0A💰 *Total: ' +
            formatarPreco(total) +
            '*%0A';


        mensagem +=
            '%0A💳 *Forma de pagamento:* ' +
            formaPagamento;

        if (formaPagamento === 'Cartão de crédito/débito' && bandeira) {
            mensagem +=
                ' (' +
                bandeira +
                ')';
        }

        mensagem += '%0A';

        if (formaPagamento === 'Dinheiro' && troco) {
            mensagem +=
                '%0A💰 *Troco para:* ' +
                troco;
        }


        mensagem +=
            '%0A📍 *Endereço:* ' +
            endereco;


        if (complemento) {
            mensagem +=
                '%0A🏠 *Complemento:* ' +
                complemento;
        }


        if (observacao) {
            mensagem +=
                '%0A📝 *Observação:* ' +
                observacao;
        }


        var numeroWhatsApp = '5551997497728';


        var url =
            'https://wa.me/' +
            numeroWhatsApp +
            '?text=' +
            mensagem;


        window.open(url, '_blank');

    });


    atualizarCampoBandeira();

    mostrarCarrinho();

})();
