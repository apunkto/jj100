export const PIZZA_IDS = ['tyri', 'mafioso', 'vegetariana'] as const
export type PizzaChoiceId = (typeof PIZZA_IDS)[number]

export function isPizzaChoiceId(id: string | null | undefined): id is PizzaChoiceId {
    return id != null && (PIZZA_IDS as readonly string[]).includes(id)
}
