/* ==========================================================================
   MÓDULOS DA TRILHA
   --------------------------------------------------------------------------
   Cada módulo segue o mesmo roteiro pedagógico:
   teoria → exemplo resolvido → prática guiada → prática independente
   → verificação (libera o próximo módulo) → revisão.

   Campos:
     prereqs           ids dos módulos que precisam estar concluídos
     originalQuestion  uma das 15 questões da lista original (1 a 8)
     practice          prática guiada        { q, opts, correct, hint }
     independent       prática independente  { q, opts, correct, hint }
     verification      questões que decidem se o módulo foi dominado
     review            perguntas de revisão (também usadas na revisão espaçada)
     videos            aulas recomendadas e o momento ideal de assistir
     xp                recompensa ao concluir o módulo

   Matemática é escrita em LaTeX entre \\( e \\) e renderizada pelo MathJax.
   ========================================================================== */
'use strict';

const MODULES = [{
    id: 1,
    title: 'Fundamentos',
    tag: 'PRECEDÊNCIA',
    icon: '⊛',
    prereqs: [],
    objective: 'Compreender a ordem das operações (PEMDAS) e aplicá-la corretamente.',
    theory: `Na engenharia de software, a precedência de operadores é lei. A regra PEMDAS define a ordem: Parênteses, Expoentes, Multiplicação/Divisão, Adição/Subtração.`,
    math: `3 + 4 \\times 2 - 6 \\div 3`,
    originalQuestion: {
        text: 'Resolva a expressão do PDF: \\( 3 + 4 \\times 2 - 6 \\div 3 \\)',
        options: ['11', '9', '7', '13'],
        correct: 1,
        hint: 'Calcule 4×2 e 6÷3 primeiro. Depois some e subtraia da esquerda para a direita.'
    },
    guidedSteps: [
        'Resolva \\( 10 - 2 \\times 3 + 4 \\div 2 \\)',
        'Multiplique e divida: \\( 10 - 6 + 2 \\)',
        'Some e subtraia da esquerda: \\( 4 + 2 = 6 \\)'
    ],
    practice: [
        { q: 'Calcule \\( 6 + 2 \\times 3 \\)', opts: ['24', '12', '18', '8'], correct: 1,
            hint: 'Multiplicação antes da adição.' },
        { q: 'Resolva \\( (4 + 6) \\div 2 \\)', opts: ['5', '8', '10', '6'], correct: 0,
            hint: 'Parênteses primeiro.' }
    ],
    independent: [
        { q: 'Calcule \\( 12 \\div 3 + 5 \\times 2 \\)', opts: ['14', '16', '18', '20'], correct: 0,
            hint: 'Divisão e multiplicação antes da adição.' },
        { q: 'Valor de \\( (8 - 3) \\times (2 + 1) \\)', opts: ['9', '12', '15', '18'], correct: 2,
            hint: 'Resolva ambos os parênteses primeiro.' }
    ],
    verification: [
        { q: 'Calcule \\( 5 + 3 \\times (4 - 2) \\)', opts: ['11', '13', '16', '19'], correct: 0,
            hint: 'Parênteses, depois multiplicação, depois adição.' }
    ],
    review: [
        { q: 'Resultado de \\( 10 - 2 \\times 3 \\)', opts: ['4', '6', '8', '24'], correct: 0,
            hint: 'Multiplicação antes da subtração.' }
    ],
    videos: [{
        title: 'Expressões Numéricas: Ordem nas Operações — Matemática Básica, Aula 3',
        channel: 'Professor Ferretto',
        desc: 'Aula completa sobre a ordem correta de resolução, incluindo os sinais de associação (parênteses, colchetes e chaves).',
        link: 'https://www.youtube.com/watch?v=BhDm2qGy780',
        momento: 'Antes da prática guiada.'
    }, {
        title: 'PEMDAS e a Ordem das Operações numa Expressão Numérica',
        channel: 'Matemática Rio com Prof. Rafael Procopio',
        desc: 'Vídeo curto, direto ao ponto — ideal para relembrar a regra antes de resolver.',
        link: 'https://www.youtube.com/watch?v=T8X9Fs8vbaE',
        momento: 'Revisão rápida antes da verificação.'
    }],
    xp: 150
}, {
    id: 2,
    title: 'Frações',
    tag: 'DENOMINADORES',
    icon: '⅓',
    prereqs: [1],
    objective: 'Dominar simplificação e operações com frações, essenciais para álgebra.',
    theory: `Frações são divisões não resolvidas. Para somar, precisamos de um denominador comum (MMC). Multiplicação é direta: numerador × numerador / denominador × denominador.`,
    math: `\\frac{12}{18} + \\frac{1}{3}`,
    originalQuestion: {
        text: 'Simplifique \\( \\frac{12}{18} \\) e some com \\( \\frac{1}{3} \\)',
        options: ['1', '3/4', '5/6', '2/3'],
        correct: 0,
        hint: 'Simplifique 12/18 = 2/3, depois 2/3 + 1/3 = 1.'
    },
    guidedSteps: [
        'Calcule \\( \\frac{3}{4} + \\frac{5}{6} \\) → MMC(4,6)=12',
        'Converta: \\( \\frac{9}{12} + \\frac{10}{12} = \\frac{19}{12} \\)'
    ],
    practice: [
        { q: 'Simplifique \\( \\frac{8}{12} \\)', opts: ['2/3', '4/6', '1/2', '3/4'], correct: 0,
            hint: 'Divida por 4.' },
        { q: 'Calcule \\( \\frac{1}{2} + \\frac{1}{4} \\)', opts: ['1/2', '3/4', '1/4', '2/6'], correct: 1,
            hint: 'MMC = 4.' }
    ],
    independent: [
        { q: 'Calcule e simplifique \\( \\frac{2}{3} \\times \\frac{3}{5} \\)', opts: ['2/5', '6/15', '1/2', '5/6'], correct: 0,
            hint: 'Multiplique numeradores e denominadores.' },
        { q: 'Calcule e simplifique \\( \\frac{3}{4} \\div \\frac{1}{2} \\)', opts: ['3/8', '3/2', '1/2', '6/4'], correct: 1,
            hint: 'Inverta e multiplique.' }
    ],
    verification: [
        { q: 'Calcule e simplifique \\( \\frac{5}{6} - \\frac{1}{3} \\)', opts: ['1/2', '1/3', '3/6', '2/3'], correct: 0,
            hint: 'MMC = 6.' }
    ],
    review: [
        { q: 'Calcule e simplifique \\( \\frac{2}{5} + \\frac{1}{10} \\)', opts: ['1/2', '3/10', '1/5', '5/10'], correct: 0,
            hint: 'MMC = 10.' }
    ],
    videos: [{
        title: 'Fração | Operações com Frações',
        channel: 'Gis com Giz',
        desc: 'Adição e subtração de frações, com e sem denominadores iguais — a base do MMC.',
        link: 'https://www.youtube.com/watch?v=UbyLqduIbIY',
        momento: 'Antes da prática guiada.'
    }, {
        title: 'Multiplicação e Divisão com Frações',
        channel: 'Gis com Giz',
        desc: 'Mostra a diferença entre os dois processos — exatamente o que cai na prática independente.',
        link: 'https://www.youtube.com/watch?v=WsWRpp35Uhc',
        momento: 'Antes da prática independente.'
    }],
    xp: 150
}, {
    id: 3,
    title: 'Funções',
    tag: 'MÉTODOS',
    icon: 'ƒ',
    prereqs: [1, 2],
    objective: 'Compreender o conceito de função, notação f(x) e avaliação.',
    theory: `Uma função é um método que recebe um argumento e retorna um valor. Avaliar f(3) é passar 3 como parâmetro para a lógica definida.`,
    math: `f(x) = x^2 - 4`,
    originalQuestion: {
        text: 'Dada \\( f(x) = x^2 - 4 \\), qual é \\( f(3) \\)?',
        options: ['5', '9', '1', '7'],
        correct: 0,
        hint: '3² = 9, −4 = 5.'
    },
    guidedSteps: [
        'Dada \\( f(x) = 3x - 5 \\), calcule \\( f(4) \\)',
        'Substitua: \\( f(4) = 3\\cdot4 - 5 = 12 - 5 = 7 \\)'
    ],
    practice: [
        { q: 'Dada \\( f(x) = x + 7 \\), qual é \\( f(3) \\)?', opts: ['10', '9', '8', '11'],
            correct: 0, hint: 'Substitua e some.' },
        { q: 'Dada \\( g(x) = 2x - 3 \\), qual é \\( g(5) \\)?', opts: ['7', '5', '10', '6'],
            correct: 0, hint: '2·5 − 3 = 7.' }
    ],
    independent: [
        { q: 'Dada \\( h(x) = x^2 + 1 \\), qual é \\( h(2) \\)?', opts: ['3', '5', '4', '6'],
            correct: 1, hint: '2²+1 = 5.' },
        { q: 'Dada \\( f(x) = 2x + 3 \\), qual é \\( f(-1) \\)?', opts: ['1', '2', '-1', '0'],
            correct: 0, hint: '2·(-1)+3 = 1.' }
    ],
    verification: [
        { q: 'Dada \\( f(x) = x^2 - 4 \\), qual é \\( f(3) \\)?', opts: ['5', '9', '1', '7'],
            correct: 0, hint: '3²−4 = 5.' }
    ],
    review: [
        { q: 'Dada \\( f(x) = 5x + 2 \\), qual é \\( f(2) \\)?', opts: ['12', '14', '10', '8'],
            correct: 0, hint: '5·2+2 = 12.' }
    ],
    videos: [{
        title: 'Funções: Noções Básicas (Aula 1 de 15)',
        channel: 'Professor Ferretto',
        desc: 'O que é uma função, como ela relaciona dois conjuntos e o que significa a notação f(x).',
        link: 'https://www.youtube.com/watch?v=SPZqQ5qn3P0',
        momento: 'Durante a explicação.'
    }, {
        title: 'Função 02: Definição, Domínio, Contradomínio e Imagem',
        channel: 'Equaciona com Paulo Pereira',
        desc: 'Reforça a definição com exemplos simples — prepara o terreno para o módulo de Domínio.',
        link: 'https://www.youtube.com/watch?v=7a8AK6C1Tzo',
        momento: 'Depois da prática guiada.'
    }],
    xp: 200
}, {
    id: 4,
    title: 'Potenciação',
    tag: 'EXPOENTES',
    icon: 'xⁿ',
    prereqs: [1, 2],
    objective: 'Dominar as propriedades dos expoentes e potências.',
    theory: `Potenciação é multiplicação repetida. Propriedades: \\( a^m \\times a^n = a^{m+n} \\), \\( (a^m)^n = a^{m\\cdot n} \\), \\( a^{-n} = 1/a^n \\).`,
    math: `2^5 \\div 2^3`,
    originalQuestion: {
        text: 'Calcule \\( 2^5 \\div 2^3 \\)',
        options: ['4', '6', '8', '16'],
        correct: 0,
        hint: 'Subtraia os expoentes: 5−3=2 → 2²=4.'
    },
    guidedSteps: [
        'Simplifique \\( (2^3 \\times 2^5) / 2^4 \\)',
        'Soma dos expoentes no numerador: \\( 2^{3+5} = 2^8 \\)',
        'Subtraia: \\( 2^{8-4} = 2^4 = 16 \\)'
    ],
    practice: [
        { q: 'Calcule \\( 2^3 \\times 2^2 \\)', opts: ['32', '16', '64', '8'], correct: 0,
            hint: 'Some os expoentes.' },
        { q: 'Calcule \\( 3^{-2} \\)', opts: ['1/9', '-6', '9', '1/6'], correct: 0,
            hint: 'Inverso de 3².' }
    ],
    independent: [
        { q: 'Calcule \\( (5^2)^3 \\)', opts: ['125', '625', '15625', '3125'], correct: 2,
            hint: 'Multiplique os expoentes.' },
        { q: 'Simplifique \\( 6^4 \\div 6^2 \\)', opts: ['\\(6^2\\)', '\\(6^6\\)', '\\(6^3\\)', '\\(6^8\\)'], correct: 0,
            hint: 'Subtraia os expoentes.' }
    ],
    verification: [
        { q: 'Calcule \\( (2 \\times 3)^2 \\)', opts: ['36', '12', '18', '24'], correct: 0,
            hint: '6² = 36.' }
    ],
    review: [
        { q: 'Calcule \\( 4^0 \\)', opts: ['0', '1', '4', '16'], correct: 1,
            hint: 'Qualquer número (exceto 0) elevado a 0 é 1.' }
    ],
    videos: [{
        title: 'Potenciação: Definição e Propriedades — Matemática Básica, Aula 6',
        channel: 'Professor Ferretto',
        desc: 'Todas as propriedades demonstradas, incluindo expoente zero e expoente negativo.',
        link: 'https://www.youtube.com/watch?v=4Vfw1XiHTpM',
        momento: 'Após a explicação.'
    }, {
        title: 'Potências e Propriedades das Potências',
        channel: 'Gis com Giz',
        desc: 'Mesma matéria com outra didática — útil se a primeira explicação não colar.',
        link: 'https://www.youtube.com/watch?v=dGOhsZqCJKc',
        momento: 'Se errar a prática independente.'
    }],
    xp: 200
}, {
    id: 5,
    title: 'Bhaskara',
    tag: 'QUADRÁTICAS',
    icon: '±',
    prereqs: [1, 3, 2],
    objective: 'Resolver equações do segundo grau com a fórmula de Bhaskara.',
    theory: `Equação quadrática: \\( ax^2 + bx + c = 0 \\). Fórmula: \\( x = \\frac{-b \\pm \\sqrt{\\Delta}}{2a} \\), com \\( \\Delta = b^2 - 4ac \\).`,
    math: `x^2 - 5x + 6 = 0`,
    originalQuestion: {
        text: 'Encontre as raízes de \\( x^2 - 5x + 6 = 0 \\)',
        options: ['1 e 6', '2 e 3', '-2 e -3', '0 e 5'],
        correct: 1,
        hint: 'Δ = 1, raízes (5±1)/2 = 3 e 2.'
    },
    guidedSteps: [
        'Resolva \\( x^2 - 5x + 6 = 0 \\) → a=1, b=-5, c=6',
        'Δ = 25 − 24 = 1',
        'x = (5 ± 1) / 2 → x₁=3, x₂=2'
    ],
    practice: [
        { q: 'Resolva \\( x^2 - 4x + 3 = 0 \\)', opts: ['1 e 3', '2 e 2', '-1 e -3', '1 e 4'],
            correct: 0, hint: 'Δ = 4, raízes (4±2)/2 = 3 e 1.' },
        { q: 'Qual o discriminante de \\( 2x^2 + 3x - 2 = 0 \\)?', opts: ['9', '25', '16', '4'],
            correct: 1, hint: 'Δ = 9+16 = 25.' }
    ],
    independent: [
        { q: 'Resolva \\( x^2 - 6x + 9 = 0 \\)', opts: ['3 (dupla)', '-3 (dupla)', '2 e 4', '0 e 6'],
            correct: 0, hint: 'Δ = 0, raiz dupla 3.' },
        { q: 'Resolva \\( x^2 + 2x - 3 = 0 \\)', opts: ['1 e -3', '-1 e 3', '1 e 3', '-1 e -3'],
            correct: 0, hint: 'Δ = 16, raízes (-2±4)/2 = 1 e -3.' }
    ],
    verification: [
        { q: 'Resolva \\( x^2 - 2x - 8 = 0 \\)', opts: ['4 e -2', '-4 e 2', '2 e 4', '-2 e -4'],
            correct: 0, hint: 'Δ = 36, raízes (2±6)/2 = 4 e -2.' }
    ],
    review: [
        { q: 'Qual o Δ de \\( x^2 + 4x + 4 = 0 \\)?', opts: ['0', '4', '8', '16'], correct: 0,
            hint: 'Δ = 16−16 = 0.' }
    ],
    videos: [{
        title: 'Fórmula de Bháskara | Como fazer Equação do 2º Grau',
        channel: 'Gis com Giz',
        desc: 'Passo a passo da fórmula, do cálculo do discriminante até as duas raízes.',
        link: 'https://www.youtube.com/watch?v=LNLvMo1PWok',
        momento: 'Antes da prática guiada.'
    }, {
        title: 'Aprenda Bhaskara de vez: Equação Completa do 2º Grau e Discriminante',
        channel: 'Equaciona com Paulo Pereira',
        desc: 'Foca no papel do Δ: por que ele decide se há duas, uma ou nenhuma raiz real.',
        link: 'https://www.youtube.com/watch?v=IHyeqc5SeXM',
        momento: 'Antes da verificação.'
    }],
    xp: 250
}, {
    id: 6,
    title: 'Domínio',
    tag: 'RUNTIME SAFETY',
    icon: '𝒟',
    prereqs: [3, 2],
    objective: 'Determinar o domínio de funções, evitando divisão por zero e raízes negativas.',
    theory: `Domínio é o conjunto de valores que \\( x \\) pode assumir. Restrições: denominador ≠ 0, radicando ≥ 0 para raízes pares, logaritmo > 0.`,
    math: `f(x) = \\sqrt{x - 5}`,
    originalQuestion: {
        text: 'Qual o domínio de \\( f(x) = \\sqrt{x-5} \\)?',
        options: ['x > 5', 'x ≥ 5', 'x ≠ 5', 'Todos os reais'],
        correct: 1,
        hint: 'Radicando deve ser ≥ 0.'
    },
    guidedSteps: [
        'Encontre o domínio de \\( f(x) = \\frac{3}{x^2 - 4} \\)',
        'Denominador não pode ser zero: \\( x^2 - 4 \\neq 0 \\)',
        'Fatore: \\( (x-2)(x+2) \\neq 0 \\) → \\( x \\neq 2 \\) e \\( x \\neq -2 \\)'
    ],
    practice: [
        { q: 'Domínio de \\( f(x) = 1/(x-5) \\)', opts: ['x ≠ 5', 'x > 5', 'x ≥ 5', 'x ≠ -5'],
            correct: 0, hint: 'Denominador não zero.' },
        { q: 'Domínio de \\( g(x) = \\sqrt{x+2} \\)', opts: ['x ≥ -2', 'x > -2', 'x ≤ -2', 'x ≠ -2'],
            correct: 0, hint: 'Radicando ≥ 0.' }
    ],
    independent: [
        { q: 'Domínio de \\( h(x) = 5/(x^2 - 9) \\)', opts: ['x ≠ 3', 'x ≠ 3 e x ≠ -3', 'x ≥ 3', 'x > 3'],
            correct: 1, hint: 'x²−9 = (x−3)(x+3).' },
        { q: 'Domínio de \\( f(x) = \\sqrt{2x-6} \\)', opts: ['x ≥ 3', 'x > 3', 'x ≤ 3', 'x < 3'],
            correct: 0, hint: '2x−6 ≥ 0 → x ≥ 3.' }
    ],
    verification: [
        { q: 'Domínio de \\( f(x) = 1/(x^2+1) \\)', opts: ['Todos os reais', 'x ≠ 0', 'x ≠ 1', 'x ≥ 0'],
            correct: 0, hint: 'x²+1 nunca é zero.' }
    ],
    review: [
        { q: 'Domínio de \\( f(x) = \\sqrt{x-5} \\)', opts: ['x ≥ 5', 'x > 5', 'x ≤ 5', 'x ≠ 5'],
            correct: 0, hint: 'Radicando ≥ 0.' }
    ],
    videos: [{
        title: 'Como determinar o domínio de uma função com raiz quadrada',
        channel: 'Só Números',
        desc: 'A restrição do radicando (≥ 0) explicada devagar, com vários exemplos.',
        link: 'https://www.youtube.com/watch?v=26neXpsj4SI',
        momento: 'Após a explicação.'
    }, {
        title: 'Como determinar o domínio de uma função com raiz no denominador',
        channel: 'Matematika',
        desc: 'O caso difícil: as duas restrições ao mesmo tempo — exatamente a questão 14 do desafio final.',
        link: 'https://www.youtube.com/watch?v=U9t17FPKU2o',
        momento: 'Antes da prática independente.'
    }],
    xp: 250
}, {
    id: 7,
    title: 'Função Composta',
    tag: 'PIPE',
    icon: '∘',
    prereqs: [3, 6],
    objective: 'Compor funções, aplicando uma ao resultado da outra.',
    theory: `Composição: \\( (f \\circ g)(x) = f(g(x)) \\). Comece de dentro para fora. A ordem importa!`,
    math: `f(x) = x+2, \\; g(x) = x^2`,
    originalQuestion: {
        text: 'Dadas \\( f(x) = x+2 \\) e \\( g(x) = x^2 \\), calcule \\( (f \\circ g)(3) \\)',
        options: ['11', '9', '7', '13'],
        correct: 0,
        hint: 'g(3)=9, f(9)=11.'
    },
    guidedSteps: [
        'Dadas \\( f(x) = x+3 \\) e \\( g(x) = 2x \\), calcule \\( (f \\circ g)(x) \\)',
        'Substitua \\( g(x) \\) em \\( f \\): \\( f(g(x)) = f(2x) = 2x + 3 \\)'
    ],
    practice: [
        { q: 'Dadas \\( f(x)=3x \\) e \\( g(x)=x-1 \\), calcule \\( (f \\circ g)(x) \\)',
            opts: ['3x-1', '3x-3', '3x+3', 'x-3'], correct: 1,
            hint: 'f(x-1)=3(x-1)=3x-3.' },
        { q: 'Dadas \\( f(x)=x^2 \\) e \\( g(x)=2x+1 \\), calcule \\( (g \\circ f)(x) \\)',
            opts: ['2x²+1', '(2x+1)²', '4x²+1', '2x²+2x+1'], correct: 0,
            hint: 'g(x²)=2x²+1.' }
    ],
    independent: [
        { q: 'Dadas \\( f(x)=x^2-1 \\) e \\( g(x)=x+2 \\), calcule \\( (f \\circ g)(x) \\)',
            opts: ['x²+4x+3', 'x²+3', 'x²+2x+1', 'x²+4x+4'], correct: 0,
            hint: 'f(x+2)=(x+2)²-1=x²+4x+3.' },
        { q: 'Dadas \\( f(x)=2x \\) e \\( g(x)=x^3 \\), calcule \\( (f \\circ g)(2) \\)',
            opts: ['16', '8', '32', '64'], correct: 0, hint: 'g(2)=8, f(8)=16.' }
    ],
    verification: [
        { q: 'Dadas \\( f(x)=x+5 \\) e \\( g(x)=3x \\), calcule \\( (g \\circ f)(1) \\)',
            opts: ['18', '15', '9', '12'], correct: 0, hint: 'f(1)=6, g(6)=18.' }
    ],
    review: [
        { q: 'Dadas \\( f(x)=4x \\) e \\( g(x)=x+2 \\), calcule \\( (f \\circ g)(3) \\)',
            opts: ['20', '14', '24', '12'], correct: 0, hint: 'g(3)=5, f(5)=20.' }
    ],
    videos: [{
        title: 'Função 10: Composta',
        channel: 'Equaciona com Paulo Pereira',
        desc: 'Como montar f(g(x)) do zero e por que a ordem da composição muda o resultado.',
        link: 'https://www.youtube.com/watch?v=EBRXQpXbXio',
        momento: 'Antes da prática guiada.'
    }, {
        title: 'Função Composta — f(g(x)) / fog e g(f(x)) / gof',
        channel: 'Somatize — Profª Edna Mendes',
        desc: 'Compara fog e gof lado a lado, que é onde a maioria dos erros acontece.',
        link: 'https://www.youtube.com/watch?v=gazdnNnAizU',
        momento: 'Se errar a prática independente.'
    }],
    xp: 300
}, {
    id: 8,
    title: 'Função Exponencial',
    tag: 'CRESCIMENTO',
    icon: 'eˣ',
    prereqs: [4, 3],
    objective: 'Compreender a função exponencial, suas propriedades e equações.',
    theory: `Função exponencial: \\( f(x) = a^x \\), com \\( a > 0 \\), \\( a \\neq 1 \\). Domínio: todos os reais; imagem: \\( (0, +\\infty) \\).`,
    math: `2^x = 64`,
    originalQuestion: {
        text: 'Resolva \\( 2^x = 64 \\)',
        options: ['5', '6', '7', '8'],
        correct: 1,
        hint: '64 = 2⁶.'
    },
    guidedSteps: [
        'Resolva \\( 2^x = 16 \\)',
        'Reescreva 16 como potência de 2: \\( 16 = 2^4 \\)',
        'Iguale bases: \\( x = 4 \\)'
    ],
    practice: [
        { q: 'Resolva \\( 3^x = 27 \\)', opts: ['2', '3', '4', '1'], correct: 1,
            hint: '27 = 3³.' },
        { q: 'Calcule \\( f(2) \\) para \\( f(x) = 5^x \\)', opts: ['10', '25', '7', '52'],
            correct: 1, hint: '5² = 25.' }
    ],
    independent: [
        { q: 'Resolva \\( 4^x = 64 \\)', opts: ['2', '3', '4', '1'], correct: 1,
            hint: '64 = 4³.' },
        { q: 'Resolva \\( 2^{x+1} = 32 \\)', opts: ['4', '3', '5', '6'], correct: 0,
            hint: '32 = 2⁵ → x+1=5 → x=4.' }
    ],
    verification: [
        { q: 'Resolva \\( 5^x = 125 \\)', opts: ['2', '3', '4', '5'], correct: 1,
            hint: '125 = 5³.' }
    ],
    review: [
        { q: 'Domínio de \\( f(x) = 2^x \\)', opts: ['Todos os reais', 'x > 0', 'x ≥ 0', 'x ≠ 0'],
            correct: 0, hint: 'Exponencial definida para todo x real.' }
    ],
    videos: [{
        title: 'Função Exponencial: Definição, Valor Numérico, Propriedades e Gráficos',
        channel: 'Gis com Giz',
        desc: 'Por que a base precisa ser positiva e diferente de 1, e como o gráfico se comporta.',
        link: 'https://www.youtube.com/watch?v=9F53vF_TV78',
        momento: 'Durante a explicação.'
    }, {
        title: 'Equação Exponencial: Igualando as Bases',
        channel: 'Equaciona com Paulo Pereira',
        desc: 'A técnica usada em todos os exercícios deste módulo: reescrever os dois lados na mesma base.',
        link: 'https://www.youtube.com/watch?v=0_r7IKcaXKk',
        momento: 'Antes da prática guiada.'
    }],
    xp: 300
}];
