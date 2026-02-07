export class AppError extends Error {
    code?: string

    constructor(message: string, code?: string) {
        super(message)
        this.name = 'AppError'
        this.code = code
    }
}
