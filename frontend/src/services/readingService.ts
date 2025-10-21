// Servicio para manejar la rotación semanal de libros en la tarea "Leer"

export interface Book {
  id: number
  format: string
  title: string
  isCompleted: boolean
}

// Lista de libros en orden de rotación semanal
export const BOOKS: Book[] = [
  { id: 1, format: 'Fisico', title: 'Guia de Supervivencia Zombie', isCompleted: false },
  { id: 2, format: 'Prestado', title: 'Mas alla de las estrellas', isCompleted: false },
  { id: 3, format: 'Kindle', title: 'Corazones Perdidos', isCompleted: false },
  { id: 4, format: 'PC Novela', title: 'Mort', isCompleted: false },
  { id: 5, format: 'Cell', title: 'El trono vacio', isCompleted: false }, // Libro actual
  { id: 6, format: 'Comics', title: '5 elementos', isCompleted: false },
  { id: 7, format: 'Tablet', title: 'El último deseo', isCompleted: false },
  { id: 8, format: 'Extra', title: 'Marvel 75 años', isCompleted: false }
]

export const readingService = {
  // Obtener libro actual basado en la semana
  getCurrentBook(): Book {
    const currentWeek = this.getCurrentWeekNumber()
    const bookIndex = (currentWeek - 1) % BOOKS.length
    return BOOKS[bookIndex]
  },

  // Obtener número de semana actual (lunes como inicio)
  getCurrentWeekNumber(): number {
    const now = new Date()
    const startOfYear = new Date(now.getFullYear(), 0, 1)
    
    // Ajustar para que lunes sea el inicio de semana
    const dayOfWeek = startOfYear.getDay()
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    const firstMonday = new Date(startOfYear.getTime() + (7 - daysToMonday) * 24 * 60 * 60 * 1000)
    
    if (now < firstMonday) {
      // Estamos en la primera semana parcial del año
      return 1
    }
    
    const diffTime = now.getTime() - firstMonday.getTime()
    const diffWeeks = Math.floor(diffTime / (7 * 24 * 60 * 60 * 1000))
    return diffWeeks + 2 // +2 porque empezamos desde la semana 2
  },

  getCurrentBookInfo(): { format: string; title: string; weekNumber: number } {
    const book = this.getCurrentBook()
    const weekNumber = this.getCurrentWeekNumber()
    
    return {
      format: book.format,
      title: book.title,
      weekNumber
    }
  },

  // Marcar libro como completado y obtener nuevo título
  async completeBook(bookId: number, newTitle: string): Promise<Book> {
    const bookIndex = BOOKS.findIndex(b => b.id === bookId)
    if (bookIndex === -1) {
      throw new Error('Libro no encontrado')
    }

    // Marcar como completado y actualizar título
    BOOKS[bookIndex].isCompleted = true
    BOOKS[bookIndex].title = newTitle.trim()

    // Guardar en localStorage para persistencia
    localStorage.setItem('reading_books', JSON.stringify(BOOKS))

    return BOOKS[bookIndex]
  },

  // Cargar libros desde localStorage si existen
  loadBooksFromStorage(): void {
    try {
      const stored = localStorage.getItem('reading_books')
      if (stored) {
        const storedBooks = JSON.parse(stored)
        // Actualizar solo los títulos y estados de completado
        storedBooks.forEach((storedBook: Book, index: number) => {
          if (BOOKS[index]) {
            BOOKS[index].title = storedBook.title
            BOOKS[index].isCompleted = storedBook.isCompleted
          }
        })
      }
    } catch (error) {
      console.warn('Error cargando libros desde localStorage:', error)
    }
  },

  // Obtener todos los libros
  getAllBooks(): Book[] {
    return [...BOOKS]
  },

  // Obtener próximo libro
  getNextBook(): Book | null {
    const currentWeek = this.getCurrentWeekNumber()
    const nextBookIndex = currentWeek % BOOKS.length
    return BOOKS[nextBookIndex] || null
  },

  // Resetear libro actual (marcar como no completado)
  resetCurrentBook(): Book {
    const currentBook = this.getCurrentBook()
    const bookIndex = BOOKS.findIndex(b => b.id === currentBook.id)
    if (bookIndex !== -1) {
      BOOKS[bookIndex].isCompleted = false
      localStorage.setItem('reading_books', JSON.stringify(BOOKS))
    }
    return BOOKS[bookIndex]
  }
}

// Cargar libros al inicializar el servicio
readingService.loadBooksFromStorage()

export default readingService