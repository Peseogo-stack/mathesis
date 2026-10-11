/* ==========================================================================
   DESAFIO FINAL – Questões 9 a 15 do PDF
   --------------------------------------------------------------------------
   As 8 primeiras questões vivem dentro dos módulos (campo
   originalQuestion). Estas 7 fecham o conjunto de 15 e são
   deliberadamente INTEGRADORAS: cada uma exige dois ou mais
   módulos ao mesmo tempo. Para trocar por outro enunciado,
   edite apenas este array — nada mais depende dele.
   ========================================================================== */
'use strict';

const FINAL_CHALLENGE = [{
    id: 9,
    topics: [1, 2],
    text: 'Calcule \\( \\left(\\frac{2}{3} + \\frac{1}{6}\\right) \\times 12 - 4 \\div 2 \\)',
    options: ['6', '8', '10', '12'],
    correct: 1,
    hint: 'Parênteses primeiro (MMC 6), depois multiplicação e divisão, e só então a subtração.',
    solution: [
        'Dentro do parêntese: MMC(3,6) = 6 → \\( \\frac{4}{6} + \\frac{1}{6} = \\frac{5}{6} \\)',
        'Multiplicação: \\( \\frac{5}{6} \\times 12 = 10 \\)',
        'Divisão: \\( 4 \\div 2 = 2 \\)',
        'Subtração por último: \\( 10 - 2 = 8 \\)'
    ]
}, {
    id: 10,
    topics: [3, 4],
    text: 'Dada \\( f(x) = 2^x - x^2 \\), qual é \\( f(4) \\)?',
    options: ['-4', '0', '8', '16'],
    correct: 1,
    hint: 'Avalie as duas potências separadamente antes de subtrair.',
    solution: [
        'Substitua x = 4: \\( f(4) = 2^4 - 4^2 \\)',
        'Potência de base 2: \\( 2^4 = 16 \\)',
        'Potência de expoente 2: \\( 4^2 = 16 \\)',
        'Subtraia: \\( 16 - 16 = 0 \\)'
    ]
}, {
    id: 11,
    topics: [5, 6],
    text: 'Qual é o domínio de \\( f(x) = \\dfrac{1}{x^2 - 5x + 6} \\)?',
    options: ['Todos os reais', 'x ≥ 3', 'x ≠ 2 e x ≠ 3', 'x ≠ -2 e x ≠ -3'],
    correct: 2,
    hint: 'Ache as raízes do denominador com Bhaskara — são exatamente os valores proibidos.',
    solution: [
        'O denominador não pode ser zero: \\( x^2 - 5x + 6 \\neq 0 \\)',
        'Δ = \\( (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1 \\)',
        'Raízes: \\( x = \\frac{5 \\pm 1}{2} \\) → 3 e 2',
        'Logo o domínio é todos os reais com \\( x \\neq 2 \\) e \\( x \\neq 3 \\)'
    ]
}, {
    id: 12,
    topics: [7, 5],
    text: 'Dadas \\( f(x) = x^2 - 1 \\) e \\( g(x) = x + 3 \\), resolva \\( (f \\circ g)(x) = 0 \\)',
    options: ['2 e 4', '-1 e 1', '-3 e 3', '-2 e -4'],
    correct: 3,
    hint: 'Monte primeiro a composta f(g(x)); só depois iguale a zero e resolva.',
    solution: [
        'Componha: \\( f(g(x)) = (x+3)^2 - 1 \\)',
        'Iguale a zero: \\( (x+3)^2 - 1 = 0 \\) → \\( (x+3)^2 = 1 \\)',
        'Extraia a raiz: \\( x + 3 = \\pm 1 \\)',
        'Duas soluções: \\( x = -2 \\) e \\( x = -4 \\)'
    ]
}, {
    id: 13,
    topics: [8, 4],
    text: 'Resolva \\( 3^{\\,2x-1} = \\dfrac{1}{27} \\)',
    options: ['1', '-1', '-2', '0'],
    correct: 1,
    hint: 'Escreva 1/27 como potência de 3 com expoente negativo e iguale os expoentes.',
    solution: [
        'Reescreva o lado direito: \\( \\frac{1}{27} = 3^{-3} \\)',
        'Bases iguais → expoentes iguais: \\( 2x - 1 = -3 \\)',
        'Isole x: \\( 2x = -2 \\)',
        'Portanto \\( x = -1 \\)'
    ]
}, {
    id: 14,
    topics: [6, 2],
    text: 'Qual é o domínio de \\( f(x) = \\dfrac{\\sqrt{x-2}}{x-5} \\)?',
    options: ['x > 2', 'x ≥ 5', 'x ≥ 2 e x ≠ 5', 'x ≠ 5'],
    correct: 2,
    hint: 'São duas restrições ao mesmo tempo: a da raiz e a do denominador.',
    solution: [
        'Restrição da raiz: \\( x - 2 \\geq 0 \\) → \\( x \\geq 2 \\)',
        'Restrição do denominador: \\( x - 5 \\neq 0 \\) → \\( x \\neq 5 \\)',
        'O domínio é a interseção das duas condições',
        'Resultado: \\( x \\geq 2 \\) e \\( x \\neq 5 \\)'
    ]
}, {
    id: 15,
    topics: [7, 8],
    text: 'Dadas \\( f(x) = 2^x \\) e \\( g(x) = x^2 - 3 \\), calcule \\( (f \\circ g)(3) \\)',
    options: ['8', '32', '12', '64'],
    correct: 3,
    hint: 'De dentro para fora: calcule g(3) e só então aplique f.',
    solution: [
        'Comece pela função de dentro: \\( g(3) = 3^2 - 3 = 6 \\)',
        'Aplique f ao resultado: \\( f(6) = 2^6 \\)',
        'Calcule a potência: \\( 2^6 = 64 \\)',
        'Logo \\( (f \\circ g)(3) = 64 \\)'
    ]
}];
