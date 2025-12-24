/**
 * Funções de validação
 */

const Validators = {
    /**
     * Valida formato de data e hora (dd/mm/aaaa hh:mm)
     */
    validarFormatoDataHora(dataHora) {
        const regex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
        return regex.test(dataHora);
    },

    /**
     * Remove caracteres não numéricos de um input
     */
    validarCampoNumerico(input) {
        input.value = input.value.replace(/[^0-9]/g, '');
    },

    /**
     * Mostra ou esconde mensagem de erro
     */
    mostrarErro(campoId, mostrar) {
        const erroElement = document.getElementById(`${campoId}-error`);
        if (erroElement) {
            erroElement.style.display = mostrar ? 'block' : 'none';
        }
    },

    /**
     * Verifica se precisa de escalonamento baseado no impacto
     */
    verificarEscalonamento(topologia, valorImpacto, tipoStatus) {
        const numero = parseInt(valorImpacto);
        if (isNaN(numero)) return false;

        // Só mostrar alerta no status inicial
        if (tipoStatus !== 'inicial') return false;

        const limites = CONFIG.escalonamento;

        if (topologia === 'HFC' && numero >= limites.HFC) {
            alert(`ATENÇÃO: Este caso precisa de escalonamento! Impacto HFC ≥ ${limites.HFC}`);
            return true;
        } else if (topologia === 'GPON' && numero >= limites.GPON) {
            alert(`ATENÇÃO: Este caso precisa de escalonamento! Impacto GPON ≥ ${limites.GPON}`);
            return true;
        }
        return false;
    },

    /**
     * Verifica se deve mostrar alerta de impacto
     */
    verificarAlertaImpacto(topologia, valorImpacto) {
        const numero = parseInt(valorImpacto);

        if (isNaN(numero)) {
            return '';
        }

        const limites = CONFIG.escalonamento;

        if (topologia === 'HFC' && numero >= limites.HFC) {
            return ' ⚠️';
        } else if (topologia === 'GPON' && numero >= limites.GPON) {
            return ' ⚠️';
        }

        return '';
    },

    /**
     * Valida nome de usuário
     */
    validarNomeUsuario(nome) {
        if (!nome || nome.trim() === '') {
            return { valido: false, mensagem: 'O nome não pode ficar vazio!' };
        }

        nome = nome.trim();

        if (/\d/.test(nome)) {
            return { valido: false, mensagem: 'O nome não pode conter números! Use apenas letras.' };
        }

        if (nome.length < 2) {
            return { valido: false, mensagem: 'O nome deve ter pelo menos 2 caracteres!' };
        }

        return { valido: true, nome: nome };
    },

    /**
     * Valida campos de data/hora obrigatórios
     */
    validarCamposDataHora(camposIds) {
        let todosValidos = true;

        camposIds.forEach(campo => {
            const valor = document.getElementById(campo)?.value;
            if (valor && !this.validarFormatoDataHora(valor)) {
                this.mostrarErro(campo, true);
                todosValidos = false;
            } else {
                this.mostrarErro(campo, false);
            }
        });

        return todosValidos;
    }
};

// Exportar para uso em outros módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Validators;
}
