export const PIZZA_IDS = ['tyri', 'mafioso', 'vegetariana'] as const
export type PizzaChoiceId = (typeof PIZZA_IDS)[number]

export type PizzaOption = {
    id: PizzaChoiceId
    label: string
    ingredients: string
}

export const PIZZA_OPTIONS: PizzaOption[] = [
    {
        id: 'tyri',
        label: 'Türi',
        ingredients:
            'Kaste, juust, hakkliha, sink, peekon, marineeritud kurk, küüslauk, punane sibul',
    },
    {
        id: 'mafioso',
        label: 'Mafioso',
        ingredients:
            'Kaste, juust, salaami, sink, suitsukana, rohelised oliivid, paprika, sinihallitusjuust, suitsujuust',
    },
    {
        id: 'vegetariana',
        label: 'Vegetariana',
        ingredients:
            'Kaste, juust, šampinjon, paprika, rohelised oliivid, ananass, tomat',
    },
]

export function pizzaLabel(id: string | null | undefined): string {
    if (!id) return ''
    const o = PIZZA_OPTIONS.find((p) => p.id === id)
    return o?.label ?? id
}

export function pizzaIngredients(id: string | null | undefined): string {
    if (!id) return ''
    const o = PIZZA_OPTIONS.find((p) => p.id === id)
    return o?.ingredients ?? ''
}
