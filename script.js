/* ==========================================================================
   X VITÓRIA — script.js
   1. Indicador "Aberto agora / Fechado"
   2. Barra de categorias do cardápio (destaca a seção que está na tela)
   3. Foto do hero (aviso se xis.jpg não carregar)
   4. Ano do rodapé

   A rolagem suave ao clicar nos links é feita pelo CSS (scroll-behavior).
   ========================================================================== */
(function () {
    'use strict';

    /* ---------- CONFIGURAÇÃO DO HORÁRIO ----------
       Se o horário mudar, altere só aqui (e o texto do HTML). */
    var HORARIO = {
        fuso: 'America/Sao_Paulo',
        abre: 18 * 60 + 30,   // 18:30, em minutos desde a meia-noite
        fecha: 30,            // 00:30 (já é a madrugada do dia seguinte)
        diaFechado: 1,        // 0 = domingo, 1 = segunda, ... 6 = sábado
        textoAbre: '18:30',
        textoFecha: '00:30'
    };

    var DIAS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };


    /* ---------- 1. ABERTO AGORA / FECHADO ---------- */
    function agoraNoFuso() {
        var partes = new Intl.DateTimeFormat('en-US', {
            timeZone: HORARIO.fuso,
            weekday: 'short',
            hour: '2-digit',
            minute: '2-digit',
            hourCycle: 'h23'
        }).formatToParts(new Date());

        var dados = {};
        partes.forEach(function (p) { dados[p.type] = p.value; });

        return {
            dia: DIAS[dados.weekday],
            minutos: parseInt(dados.hour, 10) * 60 + parseInt(dados.minute, 10)
        };
    }

    function calcularStatus() {
        var agora = agoraNoFuso();

        // Funciona de noite (a partir das 18:30) ou na madrugada (até 00:30),
        // que pertence ao expediente do dia anterior.
        var aFolga = HORARIO.diaFechado;
        var diaDepoisDaFolga = (aFolga + 1) % 7;

        var abertoNoite = agora.minutos >= HORARIO.abre && agora.dia !== aFolga;
        var abertoMadrugada = agora.minutos < HORARIO.fecha && agora.dia !== diaDepoisDaFolga;
        var aberto = abertoNoite || abertoMadrugada;

        var quando = agora.dia === aFolga ? 'amanhã' : 'hoje';

        return {
            aberto: aberto,
            curto: aberto ? 'Aberto agora' : 'Fechado',
            longo: aberto
                ? 'Aberto agora, fecha às ' + HORARIO.textoFecha
                : 'Fechado, abre ' + quando + ' às ' + HORARIO.textoAbre
        };
    }

    function atualizarStatus() {
        var status;
        try {
            status = calcularStatus();
        } catch (erro) {
            return; // se algo falhar, o HTML continua mostrando o texto padrão
        }

        document.querySelectorAll('[data-status]').forEach(function (el) {
            var texto = el.querySelector('.status-texto');
            el.setAttribute('data-aberto', String(status.aberto));
            if (texto) {
                texto.textContent = el.getAttribute('data-status') === 'curto'
                    ? status.curto
                    : status.longo;
            }
        });
    }

    atualizarStatus();
    setInterval(atualizarStatus, 60 * 1000);


    /* ---------- 2. CATEGORIA ATIVA NA BARRA ---------- */
    var cabecalho = document.querySelector('.topo');
    var barra = document.querySelector('.cat-nav');
    var lista = document.querySelector('.cat-lista');

    if (cabecalho && barra && lista) {
        var links = Array.prototype.slice.call(lista.querySelectorAll('a'));
        var categorias = links
            .map(function (link) { return document.querySelector(link.getAttribute('href')); })
            .filter(Boolean);

        var ativa = null;
        var aguardando = false;

        function definirAtiva(id) {
            if (id === ativa) return;
            ativa = id;

            links.forEach(function (link) {
                var eEsta = link.getAttribute('href') === '#' + id;
                if (eEsta) {
                    link.setAttribute('aria-current', 'true');
                    // Centraliza o botão ativo na barra (útil no celular)
                    var alvo = link.offsetLeft - (lista.clientWidth - link.offsetWidth) / 2;
                    lista.scrollTo({ left: alvo, behavior: 'smooth' });
                } else {
                    link.removeAttribute('aria-current');
                }
            });
        }

        function verificar() {
            aguardando = false;
            var limite = cabecalho.offsetHeight + barra.offsetHeight + 32;
            var atual = categorias[0];

            categorias.forEach(function (secao) {
                if (secao.hidden) return; // ignora categorias escondidas pelo modo "abas"
                if (secao.getBoundingClientRect().top <= limite) {
                    atual = secao;
                }
            });

            definirAtiva(atual.id);
        }

        window.addEventListener('scroll', function () {
            if (!aguardando) {
                aguardando = true;
                window.requestAnimationFrame(verificar);
            }
        }, { passive: true });

        window.addEventListener('resize', verificar);
        verificar();

        /* ---- Modo "abas" dentro do cardápio (Xis, Dogs, Pastéis...) ----
           Ao clicar numa categoria que fica dentro de #cardapio, mostra só
           ela (some as outras) em vez de rolar a página até lá.
           As categorias de bebidas (Copão, Kits), que ficam em outra seção,
           continuam rolando a página normalmente. */
        var secaoCardapio = document.getElementById('cardapio');

        if (secaoCardapio) {
            var categoriasCardapio = categorias.filter(function (cat) {
                return secaoCardapio.contains(cat);
            });

            if (categoriasCardapio.length > 1) {
                var linksCardapio = links.filter(function (link) {
                    var alvo = document.querySelector(link.getAttribute('href'));
                    return alvo && categoriasCardapio.indexOf(alvo) !== -1;
                });

                function mostrarCategoriaCardapio(id) {
                    categoriasCardapio.forEach(function (cat) {
                        cat.hidden = cat.id !== id;
                    });
                }

                // Começa mostrando só a primeira (Xis)
                mostrarCategoriaCardapio(categoriasCardapio[0].id);

                linksCardapio.forEach(function (link) {
                    link.addEventListener('click', function (evento) {
                        evento.preventDefault();
                        var id = link.getAttribute('href').slice(1);

                        mostrarCategoriaCardapio(id);
                        definirAtiva(id);

                        // Só rola a página se o cardápio não estiver visível
                        // (ex.: usuário já desceu até a seção de bebidas)
                        var topoDestino = secaoCardapio.getBoundingClientRect().top
                            + window.scrollY
                            - (cabecalho.offsetHeight + barra.offsetHeight);

                        if (Math.abs(window.scrollY - topoDestino) > 60) {
                            window.scrollTo({ top: topoDestino, behavior: 'smooth' });
                        }
                    });
                });
            }
        }
    }


    /* ---------- 3. FOTO DO HERO ---------- */
    var foto = document.querySelector('.hero-foto-moldura img');

    if (foto) {
        var moldura = foto.parentElement;
        var marcarSemFoto = function () { moldura.classList.add('sem-foto'); };

        foto.addEventListener('error', marcarSemFoto);
        if (foto.complete && foto.naturalWidth === 0) {
            marcarSemFoto();
        }
    }


    /* ---------- 4. ANO DO RODAPÉ ---------- */
    document.querySelectorAll('[data-ano]').forEach(function (el) {
        el.textContent = new Date().getFullYear();
    });


    /* ---------- 5. CARRINHO ----------
       Cada item do cardápio ganha um botão "+". Ao clicar, o produto é
       guardado no localStorage (mesma chave que o pedido.js usa), e a
       página pedido.html mostra o que foi guardado. */
    var CHAVE_CARRINHO = 'carrinhoXvitoria';

    // Categorias cujos nomes precisam de um prefixo para não ficarem ambíguos
    // no pedido (ex.: "Carne" na torrada x "Xis Carne").
    var PREFIXOS = { torradas: 'Torrada de ' };

    function pegarCarrinho() {
        try {
            return JSON.parse(localStorage.getItem(CHAVE_CARRINHO)) || [];
        } catch (erro) {
            return [];
        }
    }

    function salvarCarrinho(carrinho) {
        try {
            localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
        } catch (erro) {
            alert('Não foi possível salvar o carrinho neste navegador.');
        }
    }

    // "R$ 34,00" -> 34   |   "R$ 1.050,50" -> 1050.5
    function precoParaNumero(texto) {
        return parseFloat(
            texto.replace('R$', '').replace(/\./g, '').replace(',', '.').trim()
        );
    }

    // Monta o nome que vai para o carrinho
    function nomeDoItem(item) {
        var nome = item.querySelector('.item-nome').textContent.trim();
        var desc = item.querySelector('.item-desc');

        var categoria = item.closest('.categoria');
        if (categoria && PREFIXOS[categoria.id]) {
            nome = PREFIXOS[categoria.id] + nome;
        }

        // Itens que só mudam de tamanho (ex.: Copão 500 ml / 700 ml)
        if (desc && /^\d+\s*ml$/i.test(desc.textContent.trim())) {
            nome += ' (' + desc.textContent.trim() + ')';
        }

        return nome;
    }

    function adicionarAoCarrinho(nome, preco) {
        var carrinho = pegarCarrinho();

        var existente = carrinho.find(function (produto) {
            return produto.nome === nome;
        });

        if (existente) {
            existente.quantidade++;
        } else {
            carrinho.push({ nome: nome, preco: preco, quantidade: 1 });
        }

        salvarCarrinho(carrinho);
        atualizarContador();
    }

    // Bolinha com a quantidade total no botão do carrinho
    function atualizarContador() {
        var total = pegarCarrinho().reduce(function (soma, produto) {
            return soma + produto.quantidade;
        }, 0);

        document.querySelectorAll('[data-carrinho-contador]').forEach(function (el) {
            el.textContent = total;
            el.hidden = total === 0;
        });
    }

    // Botão "+" muda para "✓" por um instante
    function confirmarClique(botao) {
        var icone = botao.querySelector('i');

        botao.classList.add('adicionado');
        icone.className = 'bi bi-check-lg';

        setTimeout(function () {
            botao.classList.remove('adicionado');
            icone.className = 'bi bi-plus-lg';
        }, 900);
    }

    document.querySelectorAll('.item').forEach(function (item) {
        var nome = nomeDoItem(item);
        var preco = precoParaNumero(item.querySelector('.item-preco').textContent);

        var botao = document.createElement('button');
        botao.type = 'button';
        botao.className = 'btn-adicionar';
        botao.setAttribute('aria-label', 'Adicionar ' + nome + ' ao carrinho');
        botao.innerHTML = '<i class="bi bi-plus-lg" aria-hidden="true"></i>';

        botao.addEventListener('click', function () {
            adicionarAoCarrinho(nome, preco);
            confirmarClique(botao);
        });

        item.appendChild(botao);
    });

    atualizarContador();

    // Atualiza a bolinha ao voltar da página do pedido (botão "voltar" do navegador)
    window.addEventListener('pageshow', atualizarContador);
})();